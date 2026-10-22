# Marketplace evals

Evals for plugins that depend on other plugins live here, not in the plugin directory.
`claude plugin eval` runs each case in an isolated sandbox with no installed plugins, and
only lets a case load plugins inside the directory you run it against. So a plugin with
dependencies (here `sdd-engineering`) must be evaluated from the repository root, with the
case listing every plugin it needs in the `plugins:` front matter of `prompt.md`.
Plugins without dependencies keep their evals in `plugins/<name>/evals/`.

| Case | Type | Checks |
|---|---|---|
| `run-plan-missing-plan` | negative, smoke | `/run-plan` without a plan asks for it and starts no agents |
| `spec-creator-smoke` | smoke | `spec-creator` loads with its dependencies and writes a spec under `specs/` |
| `spec-creator-diagram` | quality gate | a three-module feature gets a spec with a Mermaid sequence diagram; used by [COST-BASELINE.md](../docs/COST-BASELINE.md) |

## Run

```bash
claude plugin eval . --trust-plugin --scaffold --allow-tools Write Edit --no-publish
```

`--scaffold` runs each case's `fixture.sh` as you; `--trust-plugin` skips the trust prompt.
A full run costs well under a dollar. Results go to `evals/results/` (git-ignored).
