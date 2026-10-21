# engineering-paved-path

The shared engineering skills used by the other plugins in this marketplace: one source of truth instead of a copy in every agent. Install it alone to give Claude consistent guidance for a TypeScript web stack.

## Install

```bash
claude plugin marketplace add olena-shabetia/olena-shabetia-dev-digest-ai-marketplace
claude plugin install engineering-paved-path@dev-digest-ai-marketplace
```

No dependencies. It is a dependency of `architecture-review` and `sdd-engineering`.

## Skills

Skills load on demand when their description matches the task, or when you call them as `/engineering-paved-path:<skill>`.

| Skill | Governs | Origin |
|---|---|---|
| `onion-architecture` | Which backend layer code belongs to and who may import it; module tier audit | first-party |
| `frontend-ui-architecture` | Where frontend code lives; splitting, promotion, import direction | first-party |
| `react-best-practices` | Component, hook and state design; anti-patterns | see [THIRD_PARTY.md](THIRD_PARTY.md) |
| `react-testing-library` | React Testing Library with Vitest | see [THIRD_PARTY.md](THIRD_PARTY.md) |
| `next-best-practices` | Next.js App Router conventions, RSC boundaries, data patterns | third-party |
| `fastify-best-practices` | Fastify routes, plugins, hooks, schema validation, errors | third-party |
| `drizzle-orm-patterns` | Drizzle schema, queries, relations, transactions, migrations | third-party |
| `postgresql-table-design` | Postgres types, indexes, constraints | third-party |
| `zod` | Zod schema authoring, parsing, error handling, inference | third-party |
| `typescript-expert` | Type-level programming, strictness, tooling | third-party |
| `security` | OWASP-based guidance on auth, input handling, uploads, secrets | see [THIRD_PARTY.md](THIRD_PARTY.md) |
| `mermaid-diagram` | Mermaid diagrams in Markdown | see [THIRD_PARTY.md](THIRD_PARTY.md) |

## The two architecture skills read your repository first

`onion-architecture` and `frontend-ui-architecture` do not hard-code a folder layout. Their first step is to read your `CLAUDE.md` / `AGENTS.md`, architecture docs and dependency-rule config. Your names and rules win; the layout in the skill is only the default vocabulary when nothing is documented.

## How other plugins use it

| Consumer | Skills it loads |
|---|---|
| `architecture-review:architecture-reviewer` | `onion-architecture`, `frontend-ui-architecture`, `next-best-practices`, `react-best-practices`, `typescript-expert` |
| `sdd-engineering:spec-creator` | `frontend-ui-architecture`, `onion-architecture`, `zod`, `mermaid-diagram` |
| `sdd-engineering:implementation-planner`, `sdd-engineering:implementer` | the full set above (see the cost note in `sdd-engineering`) |
| `sdd-engineering:plan-verifier` | `onion-architecture`, `frontend-ui-architecture`, `zod` |

Skills are referenced by their namespaced name, for example `engineering-paved-path:zod`.

## Adding or changing a skill

A skill belongs here only if two or more plugins (or a clear external consumer) need it. Keep product paths and names out of it, and keep `SKILL.md` short with details in `reference/` files. See the repository's [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Versioning

SemVer, tags `engineering-paved-path--v<version>`. A change to a skill's guidance that alters agent behavior is at least a minor release. See [CHANGELOG.md](CHANGELOG.md).
