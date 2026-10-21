# architecture-review

A read-only reviewer for architectural boundaries. It finds violations, proves each with a `file:line` it opened, and ranks them by severity. It reads your repository's own architecture rules instead of assuming a layout.

## Install

```bash
claude plugin marketplace add olena-shabetia/olena-shabetia-dev-digest-ai-marketplace
claude plugin install architecture-review@dev-digest-ai-marketplace
```

Installs `engineering-paved-path@^1.0.0` automatically; the agent loads its architecture skills from there.

## What you get

| Agent | Model | Tools | Purpose |
|---|---|---|---|
| `architecture-review:architecture-reviewer` | sonnet | `Read`, `Glob`, `Grep`, `Bash` (read-only) | Reviews boundaries and dependency direction in a change or the whole tree |

## How to use it

```text
@agent-architecture-review:architecture-reviewer Review the changes on this branch.
```

Optionally pass a scope (a diff range, a list of paths) and the paths of your architecture docs. If you give none, it reviews the current diff and discovers the docs itself.

## What it checks

- **Backend** (skill `onion-architecture`): vendor SDKs outside adapters, frameworks or ORMs leaking into the domain core, missing service or repository tiers, access to another module's internals, circular dependencies.
- **Frontend** (skill `frontend-ui-architecture`): component placement, route-local code imported across routes, business logic in components, shared layers importing local code.
- **Cross-cutting**: drift between a canonical source and a derived copy, cross-package imports that bypass declared path mappings.

It does not report style, naming or performance.

## How it finds the rules

1. Your `CLAUDE.md` / `AGENTS.md`, architecture docs (`docs/architecture*`, ADRs) and dependency-rule configuration.
2. If none define layering, it applies the default layout from its skills and labels each finding "per default layout".
3. If the repository has a dependency-rule gate (for example dependency-cruiser), it runs that in read-only report form and treats its output as evidence. A baseline of known violations is not a new finding unless the change made it worse.

**To get the best results, document your layers in one place** (a short `docs/architecture.md` that names the layers and who may import whom) and mention your dependency-check command in `AGENTS.md`.

## Report shape

```text
Verdict: <clean | findings: N>
| # | Severity | Rule | Location | Evidence | Fix |
## Gates run
## Not a finding
## Could not verify
## Caveats
```

Severity levels: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`. `## Could not verify` is never omitted.

## Guarantees

- Cannot write or edit files (`Write`, `Edit`, `NotebookEdit` are denied) and Bash is read-only.
- Never rewrites a baseline or sync target.
- Its verdict does not replace your PR gate or CI, and it says so.

## Used by

`sdd-engineering` runs it as part of the review gate in `run-plan`.

## Versioning

SemVer, tags `architecture-review--v<version>`. Depends on `engineering-paved-path@^1.0.0`. See [CHANGELOG.md](CHANGELOG.md).
