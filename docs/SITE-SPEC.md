# Catalog site spec

Static catalog of the `dev-digest-ai-marketplace` marketplace, published on GitHub Pages. This document is the input for design and implementation (lab step 6).

## 1. Goals

- Let a visitor find any plugin, skill, agent, command or hook in this repository by typing what they need.
- Let a visitor install what they found with one copy-paste command, dependencies included.
- Show what changed between releases.

## 2. Constraints and non-goals

- **No backend.** GitHub Pages serves static files only. All data is produced at build time; all logic runs in the browser.
- **No** ratings, download counters, accounts, comments, or analytics/tracking.
- **No** LLM or semantic search. Search is keyword-based.
- **English only.** Content and search queries are English. No i18n.
- **Hash routing** (`#/...`). Pages has no SPA fallback.
- **Stack:** React + Vite, output in `site/`. Search engine: MiniSearch.
- Data freshness = last deploy. The site is rebuilt on every push to `main` and on release tags.

## 3. Audience

Developers who use Claude Code and want ready-made plugins. They know the CLI, do not know our repository layout, and typically arrive with a task ("I need a skill for X"), not a plugin name.

## 4. Data: `index.json`

`scripts/build-index.mjs` walks `plugins/*` and writes `site/public/index.json`. The site loads it once at startup. The build fails if a plugin is malformed (same rules as `claude plugin validate`).

### 4.1 Shape

```jsonc
{
  "generatedAt": "2026-10-21T08:00:00Z",
  "marketplace": {
    "name": "dev-digest-ai-marketplace",
    "repo": "olena-shabetia/olena-shabetia-dev-digest-ai-marketplace",
    "stable": { "name": "dev-digest-ai-marketplace-stable", "ref": "<repo>#stable" } // see docs/RELEASES.md
  },
  "plugins": [
    {
      "id": "sdd-engineering",
      "version": "1.0.0",
      "description": "…",
      "dependencies": [{ "name": "engineering-paved-path", "range": "^1.0.0" }],
      "dependents": ["…"],               // computed
      "minClaudeCodeVersion": "2.1.110", // from COMPATIBILITY.md, may be null
      "counts": { "skill": 3, "agent": 4, "command": 0, "hook": 0 },
      "readme": "markdown…",
      "changelog": [{ "version": "1.0.0", "date": "…", "markdown": "…" }],
      "path": "plugins/sdd-engineering"
    }
  ],
  "artifacts": [
    {
      "id": "sdd-engineering/skill/run-plan", // <plugin>/<type>/<name>
      "type": "skill",                         // skill | agent | command | hook
      "name": "run-plan",
      "plugin": "sdd-engineering",
      "description": "from frontmatter",
      "tools": ["Read", "Grep"],               // agents/skills, if declared
      "body": "markdown, truncated to 20 000 chars",
      "bodyTruncated": false,
      "path": "plugins/sdd-engineering/skills/run-plan/SKILL.md"
    }
  ],
  "docs": [
    { "id": "docs/RELEASES.md", "title": "Releases", "body": "markdown…" }
  ],
  "releases": [ // computed, newest first
    { "plugin": "sdd-engineering", "version": "1.0.0", "date": "2026-10-21", "tag": "sdd-engineering--v1.0.0", "tagged": true, "note": "first changelog line" }
  ]
}
```

### 4.2 Rules

- `description` and `name` come from frontmatter / `plugin.json`; they are the primary display fields.
- `dependents` and `counts` are computed, never hand-written.
- Release entries are derived from `## <version>` headings in each `CHANGELOG.md`; dates and the `tagged` flag come from git tags `<plugin>--vX.Y.Z` (so CI checks out with full history).
- `build-index.mjs` also writes `feed.xml` (Atom) next to `index.json`.
- Size budget: `index.json` ≤ 1 MB uncompressed. If exceeded, truncate `body` further before splitting files.

## 5. Routes

| Route | Page |
|---|---|
| `#/` | Home: search box, type filter chips, featured plugins, recent releases |
| `#/search?q=<text>&type=<type>&plugin=<name>` | Search results (shareable URL) |
| `#/plugin/<name>` | Plugin detail |
| `#/artifact/<plugin>/<type>/<name>` | Artifact detail |
| `#/install` | Install builder |
| `#/whats-new` | Release feed |
| `#/getting-started` | Onboarding |
| any other | 404 with link home |

Header on every page: logo/name, global search input, nav (Plugins, Install, What's new, Getting started), GitHub link, theme toggle.

## 6. Search

### 6.1 Index

MiniSearch built in the browser from `index.json` on load. Indexed documents: plugins, artifacts, docs. Field weights:

| Field | Weight |
|---|---|
| name | 5 |
| description | 3 |
| plugin name (artifacts) | 2 |
| tools | 1.5 |
| body / readme | 1 |

Options: prefix matching on, fuzzy 0.2, combine terms with OR, boost documents matching more terms.

### 6.2 Query processing

Input is a free-text English phrase, e.g. "I need a skill for reviewing architecture".

1. Lowercase, tokenize on non-alphanumerics (keep `-` inside words).
2. Drop English stop words ("i", "need", "a", "for", "the", "want", "to", "me", …).
3. **Type words** are removed from the terms and become a type filter: `skill(s)`, `agent(s)`, `command(s)`, `hook(s)`, `plugin(s)`. Explicit chips override the inferred type. Example: "skill reviewing architecture" → type=skill, terms=[reviewing, architecture].
4. If no terms remain after step 3, show all items of the inferred type.
5. Light stemming (reviewing/review/reviews) via the engine's `processTerm`.

### 6.3 Results

- Result cards (section 7.1), ordered by score; ties broken by type order plugin > skill > agent > command > hook, then name.
- Matched terms highlighted in the description snippet. If the match is only in the body, show a ~160-char excerpt around it.
- Counter ("12 results") and active filters shown above the list; each filter removable.
- Filters: type (multi-select), plugin (multi-select). Both reflected in the URL.
- Search runs on input with 150 ms debounce; updates the URL without adding history entries per keystroke.
- **Empty state:** "No results for ‘…’", the terms that were used, tips (try fewer or more general words), and a "Browse all plugins" link. Include a "Suggest a skill" button (section 8.8).

## 7. Components

### 7.1 Artifact / plugin card

Used in results, plugin pages and home.

- Type badge (plugin / skill / agent / command / hook) — each type has a distinct icon and color token.
- Name (monospace), owning plugin (link) for artifacts, version for plugins.
- Description, clamped to 3 lines.
- Footer: "Copy install command" button (copies the plugin install line, see 8.1), link to source on GitHub.
- Whole card is a link to its detail page; the button is a separate focus target.

### 7.2 Copy button

Copies text, shows confirmation state ("Copied") for 2 s, announces via `aria-live`. Falls back to selecting the text if the Clipboard API is unavailable.

### 7.3 Code block

Monospace, copy button, horizontal scroll (never wraps commands).

## 8. Pages

### 8.1 Plugin detail

- Header: name, version, description, `min Claude Code` badge, link to GitHub folder.
- Install block: the two commands (add marketplace, install plugin) with scope selector (project / user) and channel selector (latest / stable). See 9 for exact strings. Note listing dependencies that will be installed.
- Tabs/sections: Overview (README rendered), Contents (cards grouped by type with counts), Dependencies, Changelog.
- Dependencies section: "Requires" and "Required by" lists, plus a small dependency graph (nodes = plugins, edges = dependencies; list fallback for narrow screens/screen readers).

### 8.2 Artifact detail

- Header: type badge, name, plugin (link), tools list.
- Rendered markdown body (SKILL.md / agent file), headings with anchors.
- Actions: Copy file contents, Copy plugin install command, View on GitHub.
- Sidebar/section: "Same plugin" — other artifacts of that plugin.

### 8.3 Install builder (`#/install`)

- Checklist of all plugins; checking one auto-checks its dependencies (locked, labelled "required by …").
- Options: scope (project / user), channel (latest / stable).
- Output: one code block with the generated script (marketplace add + one install line per selected plugin, deps first), one "Copy" button.
- Selection is kept in the URL (`#/install?plugins=a,b&scope=project&channel=latest`) so it can be shared.

### 8.4 What's new

- Reverse-chronological list of releases across all plugins: plugin, version, date, changelog excerpt, link to tag.
- Filter by plugin.
- Atom feed `feed.xml` generated at build time and linked from the page and `<head>`.

### 8.5 Getting started

Static content, three steps: prerequisites (Claude Code ≥ 2.1.110), add the marketplace, install a plugin. Plus a short section on switching to the stable channel / rolling back, linking to `docs/RELEASES.md`.

### 8.6 Home

- Hero: one-line value statement and a large search input with 3–4 example queries as clickable chips.
- Type filter chips with counts.
- Plugin cards grid (all plugins; there are few).
- Latest 3 releases.

### 8.7 404

Message, search box, link home.

### 8.8 "Suggest a skill"

A link (no form handling) to `https://github.com/<repo>/issues/new?template=suggestion.yml&title=…`, prefilled with the failed search query. Requires an issue template in `.github/ISSUE_TEMPLATE/`.

## 9. Install command strings

Marketplace add (once):

```bash
claude plugin marketplace add olena-shabetia/olena-shabetia-dev-digest-ai-marketplace --scope <project|user>
```

Plugin install:

```bash
claude plugin install <plugin>@dev-digest-ai-marketplace --scope <project|user>
```

The stable channel uses the stable marketplace reference defined in `docs/RELEASES.md`; the builder must read it from there, not hard-code it separately. If the two diverge, `docs/RELEASES.md` wins.

## 10. Design requirements

- **Visual tone:** clean, documentation-like, developer-oriented; content over decoration. Design reference: to be chosen during the design phase (open question, section 13).
- **Theme:** light and dark, defaulting to the OS setting, with a manual toggle persisted in `localStorage` (wrapped in try/catch).
- **Tokens:** color, spacing, radius, type scale defined as CSS variables; a separate color token per artifact type, each meeting contrast requirements in both themes.
- **Typography:** one sans-serif for UI, one monospace for names/commands.
- **Responsive:** 360 px to 1440 px. Single column below 640 px; card grid 2–3 columns above; max content width ~1100 px; 16 px side gutters on mobile. No horizontal page scroll (code blocks scroll internally).
- **States to design for every data view:** loading (skeleton), empty, error (index failed to load, with retry), populated.
- **Motion:** minimal; respect `prefers-reduced-motion`.

### Screens to design (deliverables for the design phase)

1. Home (desktop, mobile)
2. Search results: populated, empty, loading
3. Plugin detail (including dependency graph and install block)
4. Artifact detail
5. Install builder
6. What's new
7. Getting started
8. 404 / error state
9. Component sheet: card (per type), badges, buttons, copy button, code block, filter chips, inputs, light + dark

## 11. Accessibility and performance

- WCAG 2.1 AA: contrast, visible focus ring, full keyboard operation, semantic landmarks, one `h1` per page.
- Search input labelled; result count announced via `aria-live="polite"`.
- Dependency graph has a text-list equivalent.
- Initial load ≤ 300 KB JS gzipped (excluding `index.json`); time to interactive search < 1 s on a mid-range laptop on broadband.
- Per-route `<title>` and meta description; Open Graph tags on the home page.

## 12. Build and deploy

- `scripts/build-index.mjs` → `site/public/index.json`, `feed.xml` (git-ignored, generated).
- `site/` is the Vite project root (`src/`, `index.html`); `base` is `./`, so assets are relative and work under any Pages sub-path. `site/design/` holds the static design mockups and is copied into the build output after `vite build`.
- `.github/workflows/pages.yml`: on push to `main` (paths under `site/`, `plugins/`, `docs/`, the manifest and the index script) and on manual dispatch: tests, build index, type-check, build, copy `design/`, deploy with `actions/deploy-pages`. Tag pushes do not deploy on their own (the `github-pages` environment only accepts `main` by default): run the workflow manually after tagging.
- The `validate` workflow has a `site` job (tests, type-check, `build-index.mjs`, bundle) so a broken plugin or index fails PRs.

## 13. Open questions

- Visual reference / brand colors for the design phase.
- Whether the stable-channel selector appears in MVP or after the first stable release.
- ~~Whether `hook` and `command` types should be shown while no plugin ships them~~ Decided: shown as disabled entries with a count of 0, so the type system stays visible.

## 14. Acceptance criteria

1. Searching "skill architecture review" returns `architecture-review` content, with type filter inferred as skill/agent as applicable, and highlights matched words.
2. Searching a phrase with only stop words and a type ("I need a skill") lists all skills.
3. Search results URL reloads to the same results.
4. The install builder, given `sdd-engineering`, outputs install lines for its three dependencies before it.
5. Every plugin and artifact in `plugins/` is reachable from the site and opens a detail page.
6. Adding a new skill file and merging to `main` makes it searchable after the Pages deploy, with no manual edit.
7. All screens in section 10 meet the responsive, theme and a11y requirements.
8. Site works with JavaScript-loaded `index.json` only; no network calls to third-party origins at runtime.
