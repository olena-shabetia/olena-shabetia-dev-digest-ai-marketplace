#!/usr/bin/env node
// Release preflight + tagging for one plugin.
//
//   node scripts/release.mjs <plugin>           preflight + `claude plugin tag --dry-run`
//   node scripts/release.mjs <plugin> --push    preflight, then create and push the tag
//   node scripts/release.mjs <plugin> --skip-ci skip the GitHub Actions status check
//
// Release dependencies first, then consumer plugins (see docs/RELEASES.md).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [plugin, ...flags] = process.argv.slice(2);
const push = flags.includes('--push');
const skipCi = flags.includes('--skip-ci');
if (!plugin) fail('usage: node scripts/release.mjs <plugin> [--push] [--skip-ci]');

const root = run('git', ['rev-parse', '--show-toplevel']);
const pluginDir = join(root, 'plugins', plugin);
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const errors = [];
const check = (ok, msg) => { if (!ok) errors.push(msg); };

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
}
function fail(msg) { console.error(`error: ${msg}`); process.exit(1); }
function tryRun(cmd, args, opts) { try { return run(cmd, args, opts); } catch { return null; } }

if (!existsSync(pluginDir)) fail(`plugins/${plugin} does not exist`);
const manifest = readJson(join(pluginDir, '.claude-plugin', 'plugin.json'));
const marketplace = readJson(join(root, '.claude-plugin', 'marketplace.json'));
const version = manifest.version;
const tag = `${plugin}--v${version}`;

// 1. Manifest and marketplace agree.
check(manifest.name === plugin, `plugin.json name "${manifest.name}" differs from directory "${plugin}"`);
check(/^\d+\.\d+\.\d+$/.test(version ?? ''), `version "${version}" is not MAJOR.MINOR.PATCH`);
const entry = marketplace.plugins.find((p) => p.name === plugin);
check(entry, `no entry named "${plugin}" in marketplace.json`);
check(!entry || entry.version === undefined, 'marketplace entry must not set "version" (plugin.json is the single source)');

// 2. Changelog documents this version.
const changelog = join(pluginDir, 'CHANGELOG.md');
check(existsSync(changelog), 'CHANGELOG.md is missing');
if (existsSync(changelog)) {
  const re = new RegExp(`^##\\s*\\[?${version.replaceAll('.', '\\.')}\\]?(\\s|$)`, 'm');
  check(re.test(readFileSync(changelog, 'utf8')), `CHANGELOG.md has no "## ${version}" heading`);
}

// 3. Git state: clean tree, HEAD already on origin/main, tag not taken.
check(run('git', ['status', '--porcelain']) === '', 'working tree is not clean');
check(run('git', ['branch', '--show-current']) === 'main', 'not on branch main');
tryRun('git', ['fetch', '--quiet', '--tags', 'origin']);
check(tryRun('git', ['merge-base', '--is-ancestor', 'HEAD', 'origin/main']) !== null,
  'HEAD is not on origin/main (push and let CI run first)');
check(tryRun('git', ['rev-parse', '-q', '--verify', `refs/tags/${tag}`]) === null, `tag ${tag} already exists`);

// 4. Dependencies are already released and satisfy their ranges.
const tags = run('git', ['tag', '--list', '*--v*']).split('\n').filter(Boolean);
for (const dep of manifest.dependencies ?? []) {
  const { name, version: range } = typeof dep === 'string' ? { name: dep } : dep;
  const published = tags.filter((t) => t.startsWith(`${name}--v`)).map((t) => t.slice(name.length + 3));
  check(published.some((v) => satisfies(v, range)),
    `dependency ${name}@${range ?? '*'} has no matching tag (release it first)`);
}

// 5. Validation.
for (const target of [root, pluginDir]) {
  try { run('claude', ['plugin', 'validate', target]); }
  catch (e) { check(false, `claude plugin validate ${target} failed:\n${e.stdout || e.message}`); }
}

// 6. CI is green for HEAD.
if (!skipCi) {
  const out = tryRun('gh', ['run', 'list', '--commit', run('git', ['rev-parse', 'HEAD']),
    '--workflow', 'validate.yml', '--json', 'conclusion', '--limit', '1']);
  const conclusion = out ? JSON.parse(out)[0]?.conclusion : undefined;
  check(conclusion === 'success', `validate.yml for HEAD is "${conclusion ?? 'not found'}" (use --skip-ci to bypass)`);
}

if (errors.length) {
  console.error(`Release of ${tag} blocked:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  process.exit(1);
}

console.log(`Preflight passed for ${tag} at ${run('git', ['rev-parse', '--short', 'HEAD'])}`);
console.log(run('claude', ['plugin', 'tag', '--dry-run'], { cwd: pluginDir }));
if (push) {
  console.log(run('claude', ['plugin', 'tag', '--push'], { cwd: pluginDir }));
  console.log(`Released ${tag}. Next: record the release in docs/RELEASES.md if needed.`);
} else {
  console.log('Dry run only. Re-run with --push to create and push the tag.');
}

// Minimal range check: exact "1.2.3", caret "^1.2.3", tilde "~1.2.3", or none.
function satisfies(v, range) {
  if (!range) return true;
  const p = (s) => s.replace(/^[\^~]/, '').split('.').map(Number);
  const [a, b, c] = p(v);
  const [x, y, z] = p(range);
  const ge = a > x || (a === x && (b > y || (b === y && c >= z)));
  if (range.startsWith('^')) return ge && (x > 0 ? a === x : b === y);
  if (range.startsWith('~')) return ge && a === x && b === y;
  return a === x && b === y && c === z;
}
