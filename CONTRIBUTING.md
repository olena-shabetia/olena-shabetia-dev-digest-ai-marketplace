# Contributing

## Plugin structure

```
plugins/<name>/
├── .claude-plugin/plugin.json   # only the manifest lives here
├── skills/<skill>/SKILL.md
├── agents/<agent>.md
├── hooks/hooks.json
├── evals/
├── README.md
├── CHANGELOG.md
└── COMPATIBILITY.md
```

Everything except `plugin.json` goes in the plugin root, not in `.claude-plugin/`.

## Manifest rules

- `name`: kebab-case, equal to the `name` of its entry in `.claude-plugin/marketplace.json`. Must not start with `claude-`, `anthropic-` or `cc-plugin-`.
- `version`: SemVer, set only in `plugin.json` (never in the marketplace entry). Bump it on every release, otherwise users do not receive changes.
- `dependencies`: objects `{ "name": "...", "version": "^1.0.0" }`; the dependency must exist in this marketplace.
- Component paths start with `./` and stay inside the plugin; no `..`.
- Use `${CLAUDE_PLUGIN_ROOT}` / `${CLAUDE_SKILL_DIR}` for bundled files. No absolute paths, no secrets.

## Checks before a PR

```bash
claude plugin validate .
claude plugin validate ./plugins/<name>
claude --plugin-dir ./plugins/<name>   # manual behavior check
```

## PR checklist

- [ ] Manifest name equals the marketplace entry name
- [ ] `version` bumped and `CHANGELOG.md` updated
- [ ] No DevDigest-specific paths or names, no secrets, no absolute paths
- [ ] Tools/permissions of each agent reviewed
- [ ] Evals added or updated and passing
- [ ] Review from the CODEOWNERS team
