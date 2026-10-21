# Plugin composition spec

Scope: lab steps 2-4 (what we extract from DevDigest, how plugins depend on each other, what `sdd-engineering` contains). Source: `olena-shabetia/dev-digest-olena`, directory `.claude/`.

## 1. Goals and non-goals

Goals
- Four plugins: three reusable dependencies and one workflow plugin (`sdd-engineering`).
- Each shared skill and agent has exactly one source of truth.
- A plugin installed in another repository works without any DevDigest file.

Non-goals (first release)
- Hooks, MCP servers, secrets, product specs, `CLAUDE.md`/`AGENTS.md` of DevDigest.
- Agents and skills not needed by the SDD workflow or by another plugin's consumer.

## 2. Plugins and dependency graph

| Plugin | Ships | Depends on |
|---|---|---|
| `engineering-paved-path` | Shared engineering skills (section 4) | none |
| `research-tools` | Agent `researcher` (read-only) | none |
| `architecture-review` | Agent `architecture-reviewer` (generalized) | `engineering-paved-path@^1.0.0` |
| `sdd-engineering` | Agents `spec-creator`, `implementation-planner`, `implementer`, `plan-verifier`; skills `run-plan`, `workflow-retro`, `engineering-insights`; evals; docs | all three above, `^1.0.0` |

```
sdd-engineering
├── engineering-paved-path@^1.0.0
├── research-tools@^1.0.0
└── architecture-review@^1.0.0
    └── engineering-paved-path@^1.0.0
```

Cross-plugin references use namespaced names: `engineering-paved-path:zod`, `research-tools:researcher`, `architecture-review:architecture-reviewer`.

## 3. Component inventory (source -> target)

| Source in DevDigest `.claude/` | Target | Action |
|---|---|---|
| `agents/spec-creator.md` | `sdd-engineering` | Generalize: remove `specs/**`, Zod contract and route cross-checks tied to DevDigest; make spec output path an explicit input with a documented default |
| `agents/implementation-planner.md` (399 lines) | `sdd-engineering` | Generalize: remove `pr-self-review`, per-package `AGENTS.md`/`INSIGHTS.md` assumptions; plan path is an input (default `plans/`) |
| `agents/implementer.md` | `sdd-engineering` | Generalize: replace `server/`, `client/`, `reviewer-core` and `pnpm` commands with the target repo's test command from its own instructions; define behavior when none is found |
| `agents/plan-verifier.md` | `sdd-engineering` | Generalize: skill list and file layout assumptions |
| `agents/researcher.md` | `research-tools` | Near-copy; already generic (read-only, no skills) |
| `agents/architecture-reviewer.md` | `architecture-review` | Generalize: drop ring names, `dependency-cruiser` gate, `@devdigest/*`; read repository-local architecture docs instead |
| `skills/run-plan` | `sdd-engineering` | Generalize: `plans/<slug>.md` becomes an input; drop `pnpm db:migrate` and root `AGENTS.md` wording |
| `skills/workflow-retro` (+ `reference/`) | `sdd-engineering` | Generalize: drop `.devdigest/review/last-report.json`; scripts referenced via `${CLAUDE_SKILL_DIR}` |
| `skills/engineering-insights` (+ `reference/`) | `sdd-engineering` | Generalize: routing table (`client/`, `server/`, ...) becomes "nearest module's `INSIGHTS.md`"; examples in `entry-quality.md` mention DevDigest paths |
| `evals/workflow/*` | `sdd-engineering/evals` | Rework as plugin behavior evals (spec, plan, verify, negative case) |
| `skills/*` listed in section 4 | `engineering-paved-path` | Copy, then audit for product paths |
| `agents/architecture-reviewer-lite.md` | not shipped | A/B experiment artifact |
| `agents/test-writer.md`, `agents/doc-writer.md` | not shipped | Not used by the SDD workflow; candidates for a later plugin |
| `skills/pr-self-review`, `hooks/review-gate.sh` | not shipped | Reads `.devdigest/review/`; hooks are also ignored in plugin agents, so would need plugin-level hooks. Drop `pr-self-review` from agent `skills:` lists |
| `skills/dependencies-checker` | not shipped | No SDD consumer |
| `skill-library/`, `skills/` (API contract), `.claude-plugin/` | not shipped | Separate DevDigest plugin with its own manifest |
| `settings*.json`, `skill-evals/`, `worktrees/`, `agents/README.md`, `skills/README.md` | not shipped | Local state and project docs |

## 4. Shared skills in `engineering-paved-path`

Rule from the lab: keep only skills with a real consumer; a long list "just in case" inflates discovery context and support cost.

Consumers are taken from the `skills:` frontmatter of the DevDigest agents. Agent frontmatter `skills:` injects the full skill body at agent start, so this list also drives cost (see section 7).

| Skill | Size (md lines) | Consumers | Decision |
|---|---|---|---|
| `onion-architecture` | 439 (+ eval fixtures) | spec-creator, planner, implementer, verifier, reviewer | Generalize; tied to `server/`, `reviewer-core/`, `@devdigest/*`. Move fixtures with DevDigest paths out |
| `frontend-ui-architecture` | 556 | spec-creator, planner, implementer, verifier, reviewer | Generalize; tied to `client/`, `@devdigest/ui` |
| `zod` | 5650 | spec-creator, planner, implementer, verifier | Copy, audit |
| `fastify-best-practices` | 8018 | planner, implementer | Copy, audit |
| `drizzle-orm-patterns` | 2387 | planner, implementer | Copy, audit |
| `postgresql-table-design` | 202 | planner, implementer | Copy, audit |
| `next-best-practices` | 3389 | planner, implementer, reviewer | Copy, audit |
| `react-best-practices` | 544 | planner, implementer, reviewer | Copy, audit |
| `react-testing-library` | 648 | planner, implementer | Copy, audit |
| `typescript-expert` | 814 | planner, implementer, reviewer | Copy, audit |
| `security` | 1436 | planner, implementer | Copy, audit |
| `mermaid-diagram` | 613 | spec-creator, planner, implementer | Copy, audit |

`engineering-insights` is not here: its only consumers are SDD agents, so it ships in `sdd-engineering`.

## 5. `sdd-engineering` layout

```
plugins/sdd-engineering/
├── .claude-plugin/plugin.json      # name, version, dependencies
├── agents/                         # spec-creator, implementation-planner, implementer, plan-verifier
├── skills/                         # run-plan, workflow-retro, engineering-insights
├── evals/                          # behavior + negative evals
├── README.md                       # how the pieces work together (below)
├── CHANGELOG.md                    # release history, one "## <version>" heading per release
└── COMPATIBILITY.md                # Claude Code >=2.1.110 and anything newer you use
```

README outline
1. What the plugin does, in one paragraph.
2. Install, and which dependency plugins come with it.
3. Flow diagram (Mermaid): request -> `spec-creator` (may call `research-tools:researcher`) -> spec -> `implementation-planner` -> plan -> `run-plan` -> `implementer` units -> `architecture-review:architecture-reviewer` + `plan-verifier` gate -> optional `workflow-retro`.
4. Inputs and outputs: where the spec and the plan are written, how to override.
5. Behavior when the test command cannot be found.
6. Agent table: model, tools, what it may write.
7. Links to CHANGELOG and COMPATIBILITY.

`plugin.json` dependencies:

```json
"dependencies": [
  { "name": "engineering-paved-path", "version": "^1.0.0" },
  { "name": "research-tools", "version": "^1.0.0" },
  { "name": "architecture-review", "version": "^1.0.0" }
]
```

## 6. Editorial rules for every extracted file

- No DevDigest names or paths (`client/`, `server/`, `reviewer-core`, `@devdigest/*`, `.devdigest/`, `pnpm`-specific commands).
- Repository layout becomes explicit inputs with documented defaults.
- Skills and agents referenced by full namespaced name.
- Bundled files via `${CLAUDE_PLUGIN_ROOT}`; scripts inside a skill via `${CLAUDE_SKILL_DIR}`.
- Plugin agents ignore the frontmatter fields `permissionMode`, `hooks`, `mcpServers` and `initialPrompt`; supported fields include `name`, `description`, `model`, `tools`, `disallowedTools`, `skills`, `maxTurns`. Review `tools`/`disallowedTools` of every agent explicitly.
- No duplicated instructions between an agent prompt and a skill; details live in skill `reference/` files loaded on demand.
- No secrets in manifests.
- A `CLAUDE.md` at a plugin root is not loaded; put instructions in a skill.

## 7. Risks and open questions

- Preloading: DevDigest agents preload 12-14 skills through `skills:` (about 25k md lines for the planner and implementer, mostly `fastify` and `zod`). This is the main candidate for the lab's cost experiment (step 8).
- Cross-plugin skill preloading: the docs say agents support `skills` but not explicitly that a plugin agent can preload a dependency plugin's skill by namespaced name. Verified on Claude Code 2.1.299: `architecture-review:architecture-reviewer` had all five `engineering-paved-path:*` skills in context. Re-check after upgrades.
- `onion-architecture` and `frontend-ui-architecture` generalization is the largest editorial task; decide whether they become generic "read the repo's architecture docs" skills or stay out of the first release.
- Evals: `evals/` in DevDigest is a pnpm workspace with a proxy and results; the plugin evals must be self-contained and need a new runner decision.
- Plugin `bin/` and hooks are out of scope; if `pr-self-review` is revived later, it needs plugin-level hooks, and `bin/` blocks claude.ai org sync.

## 8. Work order

1. Generalize and copy `engineering-paved-path` skills (start with those that need no editing).
2. Extract `researcher` into `research-tools`.
3. Generalize `architecture-reviewer` into `architecture-review`.
4. Assemble `sdd-engineering`: agents, skills, evals, README, CHANGELOG, COMPATIBILITY.
5. Add the `dependencies` block, then verify with `claude plugin validate` and `claude plugin list --json`.
