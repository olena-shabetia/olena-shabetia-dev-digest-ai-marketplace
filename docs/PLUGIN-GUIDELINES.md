# Plugin guidelines

How to decide what ships in a plugin, and who is accountable for it. Mechanics (manifest rules, PR checklist) are in [CONTRIBUTING.md](../CONTRIBUTING.md); the extraction decisions are in [PLUGINS-SPEC.md](PLUGINS-SPEC.md).

## Portable vs local

Reusable pieces go in plugins: skills, agents, evals without product paths, and the docs that explain them. Stay out of plugins: project-specific files, optional integrations that need credentials, and local leftovers (cache, memory, worktrees, absolute paths).

A component ships only if all three are true:
1. **A named consumer.** A concrete scenario where someone uses it. "Might be useful" does not count; a long list of skills inflates discovery context and support cost.
2. **No product assumptions.** No paths, package names, commands or tools of the project it came from. It discovers the target repository's layout (`AGENTS.md`, `CLAUDE.md`, docs) or takes it as an input with a documented default.
3. **One owner.** Someone answers for it, per plugin, via CODEOWNERS.

## What ships and why

| Plugin | Component | Consumer scenario | Why it ships here |
|---|---|---|---|
| `engineering-paved-path` | 12 shared skills (React, Next.js, Fastify, Drizzle, PostgreSQL, Zod, TypeScript, security, architecture, Mermaid) | `sdd-engineering` agents preload them; also usable alone on a TypeScript web project | Shared by more than one plugin, so it lives once and is a dependency, not copied |
| `research-tools` | `researcher` agent | `spec-creator` delegates external lookups; anyone asking a cited question | Read-only and generic; usable without the SDD workflow |
| `architecture-review` | `architecture-reviewer` agent | `run-plan` review loop; standalone boundary review | Generalized to read the repository's own architecture docs instead of fixed layer names |
| `sdd-engineering` | `spec-creator`, `implementation-planner`, `implementer`, `plan-verifier` | The spec, plan, implement, verify workflow | The workflow is the product; the agents only make sense together |
| `sdd-engineering` | skills `run-plan`, `workflow-retro`, `engineering-insights` | Running an approved plan; retrospective; recording lessons | Part of the same workflow; plan and spec paths are inputs |

Not shipped, with reasons, is listed in section 3 of [PLUGINS-SPEC.md](PLUGINS-SPEC.md) (for example experiment agents, `pr-self-review`, project settings).

## Owners

Ownership is by plugin in [CODEOWNERS](../CODEOWNERS), and every PR touching a plugin needs review from its owner. Today one person owns all four; when a team takes a plugin, change its line in CODEOWNERS and update the table above only if its scope changes.

## Boundaries between plugins

- A plugin may depend on another only through `dependencies` in `plugin.json` with a version range, and refers to it by namespaced name (`engineering-paved-path:zod`). No copying a dependency's content.
- Dependencies point one way. `sdd-engineering` depends on the other three; none of them depends on it.
- A change to a dependency that alters behavior is a version bump and a `CHANGELOG.md` entry; consumers get it only after they update.

## Evals

A behavior change needs an eval or an updated one. Plugins without dependencies keep evals in `plugins/<name>/evals/`; plugins with dependencies are evaluated from the repository `evals/` directory because the eval sandbox has no installed plugins (see [evals/README.md](../evals/README.md)). Include at least one negative case for any guarantee the README makes, such as "never writes files".
