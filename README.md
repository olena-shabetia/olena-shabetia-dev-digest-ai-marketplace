# dev-digest-ai-marketplace

Claude Code plugin marketplace with components extracted from DevDigest.

| Plugin | Purpose |
|---|---|
| `engineering-paved-path` | Shared engineering skills |
| `research-tools` | Read-only `researcher` agent |
| `architecture-review` | Generalized `architecture-reviewer` |
| `sdd-engineering` | Spec-driven development workflow (depends on the three above) |

## Install

```bash
claude plugin marketplace add olena-shabetia/olena-shabetia-dev-digest-ai-marketplace --scope project
claude plugin install sdd-engineering@dev-digest-ai-marketplace --scope project
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Docs: [guidelines](docs/PLUGIN-GUIDELINES.md), [security](docs/SECURITY.md), [releases](docs/RELEASES.md), [site spec](docs/SITE-SPEC.md), [cost baseline](docs/COST-BASELINE.md).
