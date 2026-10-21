# Compatibility

| Requirement | Value |
|---|---|
| Claude Code | `>=2.1.110` (version-constrained plugin dependencies) |
| Dependencies | `engineering-paved-path@^1.0.0`, `research-tools@^1.0.0`, `architecture-review@^1.0.0` |
| Platform | any; the plugin has no scripts or binaries |
| Tools used by agents | `Read`, `Glob`, `Grep`, `Bash` (read-only for most agents), `Write`, `Edit`, `Skill`, `TodoWrite`, `Agent` (only `spec-creator`, only for `researcher`) |

## Behavior to know about

- **Repository layout is discovered, not assumed.** Agents read `CLAUDE.md` / `AGENTS.md`, decision logs, specs and `docs/` before acting. The default spec directory is `specs/` and the default plan directory is `plans/`.
- **No test command found.** The `implementer` does not invent one. It reports the tier as `not found` under `GATES`, states where it looked, and finishes the unit as `partial` unless the plan says the unit has no testable behavior.
- **Agent frontmatter limits.** Plugin agents ignore `permissionMode`, `hooks` and `mcpServers`; this plugin does not rely on them.
- **Cross-plugin skill preloading:** agents list dependency skills by namespaced name in `skills:` (for example `engineering-paved-path:zod`). Not explicitly documented; verified on Claude Code 2.1.299. See the README, "Known limitations".

If a later release uses a newer Claude Code feature, list it here and raise the minimum version.
