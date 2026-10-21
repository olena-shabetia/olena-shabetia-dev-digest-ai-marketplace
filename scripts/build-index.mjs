#!/usr/bin/env node
// Build the catalog data for the GitHub Pages site (docs/SITE-SPEC.md, section 4).
//
//   node scripts/build-index.mjs                 write site/public/index.json and feed.xml
//   --root <dir>   repository root (default: the parent of scripts/)
//   --out <dir>    output directory (default: <root>/site/public)
//
// Walks plugins/*, reads manifests, skills, agents, commands, hooks, READMEs and
// changelogs. Exits non-zero when a plugin is malformed, so a broken catalog
// fails CI instead of being deployed.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const root = resolve(opt('--root') ?? join(dirname(fileURLToPath(import.meta.url)), '..'));
const outDir = resolve(opt('--out') ?? join(root, 'site', 'public'));

const BODY_LIMIT = 20_000;
const INDEX_BUDGET = 1_000_000;
const SEMVER = /^\d+\.\d+\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?$/;

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

const rel = (p) => relative(root, p).split('\\').join('/');
const read = (p) => readFileSync(p, 'utf8');
const readJson = (p) => {
  try {
    return JSON.parse(read(p));
  } catch (e) {
    fail(`${rel(p)}: ${e.message}`);
    return null;
  }
};
const dirs = (p) =>
  existsSync(p) ? readdirSync(p).filter((n) => statSync(join(p, n)).isDirectory()).sort() : [];
const files = (p, ext) =>
  existsSync(p) ? readdirSync(p).filter((n) => n.endsWith(ext) && statSync(join(p, n)).isFile()).sort() : [];
const git = (...a) => {
  try {
    return execFileSync('git', a, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
};

const truncate = (text, limit = BODY_LIMIT) =>
  text.length > limit ? { body: text.slice(0, limit), truncated: true } : { body: text, truncated: false };

// ---------- frontmatter ----------

const unquote = (v) => v.replace(/^(['"])(.*)\1$/, '$2');

function parseList(value) {
  const v = value.trim();
  if (!v) return [];
  if (v.startsWith('[') && v.endsWith(']')) return v.slice(1, -1).split(',').map((s) => unquote(s.trim())).filter(Boolean);
  // "Read, Grep, Bash(git:*)": split on commas that are not inside parentheses
  return v.split(/,\s*(?![^()]*\))/).map((s) => unquote(s.trim())).filter(Boolean);
}

function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { data: {}, body: text };
  const lines = m[1].split(/\r?\n/);
  const data = {};
  for (let i = 0; i < lines.length; i++) {
    const kv = /^([\w-]+):\s*(.*)$/.exec(lines[i]);
    if (!kv) continue;
    const [, key, raw] = kv;
    if (/^[>|][+-]?$/.test(raw.trim())) {
      const block = [];
      while (i + 1 < lines.length && /^\s+\S|^\s*$/.test(lines[i + 1])) block.push(lines[++i].trim());
      data[key] = raw.trim().startsWith('>') ? block.join(' ').replace(/\s+/g, ' ').trim() : block.join('\n').trim();
    } else if (raw.trim() === '') {
      const items = [];
      while (i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) items.push(unquote(lines[++i].replace(/^\s*-\s+/, '').trim()));
      data[key] = items.length ? items : '';
    } else {
      data[key] = unquote(raw.trim());
    }
  }
  return { data, body: text.slice(m[0].length) };
}

const toolsOf = (data) => {
  const v = data['allowed-tools'] ?? data.tools ?? data.allowed_tools ?? '';
  return Array.isArray(v) ? v : parseList(String(v));
};

// ---------- repository ----------

function detectRepo() {
  const env = process.env.GITHUB_REPOSITORY;
  if (env && env.includes('/')) return env;
  const url = git('remote', 'get-url', 'origin');
  const m = url && /github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/.exec(url);
  if (m) return m[1];
  fail('cannot determine the GitHub repository: set GITHUB_REPOSITORY or add an origin remote');
  return 'unknown/unknown';
}

const marketplaceFile = join(root, '.claude-plugin', 'marketplace.json');
const marketplace = existsSync(marketplaceFile) ? readJson(marketplaceFile) : (fail('.claude-plugin/marketplace.json is missing'), null);
const repo = detectRepo();
const listed = new Map((marketplace?.plugins ?? []).map((p, i) => [p.name, i]));
const marketplaceName = marketplace?.name ?? 'marketplace';

// Stable channel naming is owned by docs/RELEASES.md; warn if it drifts.
const stableName = `${marketplaceName}-stable`;
const releasesDoc = join(root, 'docs', 'RELEASES.md');
if (existsSync(releasesDoc) && !read(releasesDoc).includes(stableName)) {
  warn(`docs/RELEASES.md does not mention "${stableName}": check the stable channel name`);
}

// ---------- plugins ----------

const normalizeDeps = (raw, owner) => {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : Object.entries(raw).map(([name, range]) => ({ name, range }));
  return list
    .map((d) => {
      if (typeof d === 'string') {
        const at = d.lastIndexOf('@');
        return at > 0 ? { name: d.slice(0, at), range: d.slice(at + 1) } : { name: d, range: '*' };
      }
      if (d && typeof d === 'object' && d.name) return { name: d.name, range: d.range ?? d.version ?? '*' };
      fail(`${owner}: unrecognised dependency entry ${JSON.stringify(d)}`);
      return null;
    })
    .filter(Boolean);
};

function parseChangelog(file) {
  if (!existsSync(file)) return [];
  const text = read(file);
  const heading = /^##\s+\[?v?(\d+\.\d+\.\d+[\w.+-]*)\]?[ \t]*(?:[-–—(][ \t]*(\d{4}-\d{2}-\d{2})\)?)?[ \t]*$/gm;
  const hits = [...text.matchAll(heading)];
  return hits.map((h, i) => {
    const end = i + 1 < hits.length ? hits[i + 1].index : text.length;
    return { version: h[1], date: h[2] ?? null, markdown: text.slice(h.index + h[0].length, end).trim() };
  });
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');

function collectArtifacts(plugin, pluginDir) {
  const out = [];
  const add = (type, name, description, tools, text, file) => {
    const { body, truncated } = truncate(text);
    if (!description) warn(`${rel(file)}: no description in frontmatter`);
    out.push({
      id: `${plugin}/${type}/${name}`,
      type,
      name,
      plugin,
      description: description ?? '',
      tools,
      body,
      bodyTruncated: truncated,
      path: rel(file),
    });
  };

  for (const d of dirs(join(pluginDir, 'skills'))) {
    const file = join(pluginDir, 'skills', d, 'SKILL.md');
    if (!existsSync(file)) continue;
    const { data, body } = parseFrontmatter(read(file));
    add('skill', slug(String(data.name || d)), data.description, toolsOf(data), body.trim(), file);
  }
  for (const f of files(join(pluginDir, 'agents'), '.md')) {
    const file = join(pluginDir, 'agents', f);
    const { data, body } = parseFrontmatter(read(file));
    add('agent', slug(String(data.name || f.replace(/\.md$/, ''))), data.description, toolsOf(data), body.trim(), file);
  }
  for (const f of files(join(pluginDir, 'commands'), '.md')) {
    const file = join(pluginDir, 'commands', f);
    const { data, body } = parseFrontmatter(read(file));
    add('command', slug(String(data.name || f.replace(/\.md$/, ''))), data.description, toolsOf(data), body.trim(), file);
  }
  const hooksFile = join(pluginDir, 'hooks', 'hooks.json');
  if (existsSync(hooksFile)) {
    const json = readJson(hooksFile);
    const seen = new Set();
    for (const [event, groups] of Object.entries(json?.hooks ?? {})) {
      (Array.isArray(groups) ? groups : []).forEach((g) => {
        let name = slug(g.matcher ? `${event}-${g.matcher}` : event);
        for (let n = 2; seen.has(name); n++) name = `${slug(g.matcher ? `${event}-${g.matcher}` : event)}-${n}`;
        seen.add(name);
        const cmds = (g.hooks ?? []).map((h) => h.command ?? h.prompt ?? h.type).filter(Boolean);
        const text = '```json\n' + JSON.stringify({ [event]: [g] }, null, 2) + '\n```';
        add('hook', name, `Runs on ${event}${g.matcher ? ` for ${g.matcher}` : ''}: ${cmds.join('; ')}`, [], text, hooksFile);
      });
    }
  }
  return out;
}

const plugins = [];
const artifacts = [];
const changelogs = new Map();

for (const dir of dirs(join(root, 'plugins'))) {
  const pluginDir = join(root, 'plugins', dir);
  const manifestFile = join(pluginDir, '.claude-plugin', 'plugin.json');
  if (!existsSync(manifestFile)) {
    fail(`plugins/${dir}: .claude-plugin/plugin.json is missing`);
    continue;
  }
  const manifest = readJson(manifestFile);
  if (!manifest) continue;
  for (const key of ['name', 'version', 'description']) {
    if (!manifest[key] || typeof manifest[key] !== 'string') fail(`plugins/${dir}: plugin.json needs a string "${key}"`);
  }
  if (manifest.name && manifest.name !== dir) fail(`plugins/${dir}: plugin.json name "${manifest.name}" differs from the directory`);
  if (manifest.version && !SEMVER.test(manifest.version)) fail(`plugins/${dir}: version "${manifest.version}" is not SemVer`);
  if (!listed.has(dir)) fail(`plugins/${dir}: not listed in .claude-plugin/marketplace.json`);

  const readmeFile = join(pluginDir, 'README.md');
  const compatFile = join(pluginDir, 'COMPATIBILITY.md');
  const minVersion = existsSync(compatFile) ? (/>=\s*v?(\d+\.\d+\.\d+)/.exec(read(compatFile))?.[1] ?? null) : null;
  const changelog = parseChangelog(join(pluginDir, 'CHANGELOG.md'));
  changelogs.set(dir, changelog);
  const mine = collectArtifacts(dir, pluginDir);
  artifacts.push(...mine);

  plugins.push({
    id: dir,
    version: manifest.version ?? '0.0.0',
    description: manifest.description ?? '',
    dependencies: normalizeDeps(manifest.dependencies, `plugins/${dir}`),
    dependents: [],
    minClaudeCodeVersion: minVersion,
    counts: ['skill', 'agent', 'command', 'hook'].reduce((c, t) => ({ ...c, [t]: mine.filter((a) => a.type === t).length }), {}),
    readme: existsSync(readmeFile) ? truncate(read(readmeFile)).body : '',
    changelog,
    path: rel(pluginDir),
  });
}

for (const name of listed.keys()) {
  if (!plugins.some((p) => p.id === name)) fail(`marketplace.json lists "${name}" but plugins/${name} was not found`);
}

plugins.sort((a, b) => (listed.get(a.id) ?? 99) - (listed.get(b.id) ?? 99));

for (const p of plugins) {
  for (const d of p.dependencies) {
    const target = plugins.find((x) => x.id === d.name);
    if (!target) warn(`${p.id}: dependency "${d.name}" is not in this marketplace`);
    else if (!target.dependents.includes(p.id)) target.dependents.push(p.id);
  }
}

// ---------- releases ----------

const tagDates = new Map();
const tagList = git('for-each-ref', '--format=%(refname:short)|%(creatordate:short)', 'refs/tags');
for (const line of (tagList ?? '').split('\n').filter(Boolean)) {
  const [tag, date] = line.split('|');
  tagDates.set(tag, date);
}

const firstLine = (md) => {
  const line = md.split('\n').map((l) => l.replace(/^[-*]\s+|^#+\s+/, '').trim()).find(Boolean) ?? '';
  return line.replace(/[`*_]|\[([^\]]+)\]\([^)]*\)/g, '$1').slice(0, 220);
};

const releases = [];
for (const [plugin, entries] of changelogs) {
  for (const e of entries) {
    const tag = `${plugin}--v${e.version}`;
    releases.push({ plugin, version: e.version, date: tagDates.get(tag) ?? e.date, tag, tagged: tagDates.has(tag), note: firstLine(e.markdown) });
  }
}
releases.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.plugin.localeCompare(b.plugin));

// ---------- docs ----------

// Opt-in: only documents meant for marketplace users are searchable. Specs, guidelines and
// other contributor-facing files stay out; add a file here to publish it.
const PUBLIC_DOCS = ['RELEASES.md', 'SECURITY.md'];

const docs = PUBLIC_DOCS.flatMap((f) => {
  const file = join(root, 'docs', f);
  if (!existsSync(file)) {
    warn(`docs/${f} is listed in PUBLIC_DOCS but does not exist`);
    return [];
  }
  const text = read(file);
  return [{ id: `docs/${f}`, title: /^#\s+(.+)$/m.exec(text)?.[1].trim() ?? f.replace(/\.md$/, ''), body: truncate(text).body }];
});

// ---------- write ----------

if (errors.length) {
  console.error(`build-index: ${errors.length} error(s)\n` + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}

const index = {
  generatedAt: new Date().toISOString(),
  marketplace: { name: marketplaceName, repo, stable: { name: stableName, ref: `${repo}#stable` } },
  plugins,
  artifacts,
  docs,
  releases,
};

let json = JSON.stringify(index);
if (Buffer.byteLength(json) > INDEX_BUDGET) {
  for (const a of index.artifacts) {
    if (a.body.length > 4000) {
      a.body = a.body.slice(0, 4000);
      a.bodyTruncated = true;
    }
  }
  json = JSON.stringify(index);
  warn('index.json exceeded 1 MB: artifact bodies were cut to 4000 characters');
}
if (Buffer.byteLength(json) > INDEX_BUDGET) {
  console.error('build-index: index.json is still over the 1 MB budget; split the index before adding more content');
  process.exit(1);
}

const [owner, repoName] = repo.split('/');
const siteUrl = `https://${owner}.github.io/${repoName}/`;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${esc(siteUrl)}</id>
  <title>${esc(marketplaceName)} releases</title>
  <link rel="self" href="${esc(siteUrl)}feed.xml"/>
  <link rel="alternate" href="${esc(siteUrl)}#/whats-new"/>
  <updated>${index.generatedAt}</updated>
${releases
  .slice(0, 50)
  .map((r) => {
    const link = r.tagged ? `https://github.com/${repo}/releases/tag/${r.tag}` : `${siteUrl}#/plugin/${r.plugin}`;
    return `  <entry>
    <id>tag:github.com,${r.date ?? '1970-01-01'}:${esc(r.tag)}</id>
    <title>${esc(`${r.plugin} ${r.version}`)}</title>
    <updated>${r.date ? `${r.date}T00:00:00Z` : index.generatedAt}</updated>
    <link href="${esc(link)}"/>
    <summary>${esc(r.note)}</summary>
  </entry>`;
  })
  .join('\n')}
</feed>
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'index.json'), json);
writeFileSync(join(outDir, 'feed.xml'), feed);
for (const w of warnings) console.warn(`warning: ${w}`);
console.log(
  `build-index: ${plugins.length} plugins, ${artifacts.length} artifacts, ${docs.length} docs, ${releases.length} releases, ${(Buffer.byteLength(json) / 1024).toFixed(1)} KB -> ${rel(outDir) || '.'}`,
);
