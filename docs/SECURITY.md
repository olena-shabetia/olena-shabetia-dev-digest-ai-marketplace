# Security

## Trust model

A plugin runs with the trust of whoever installs it. Its agents and skills act with the tools they declare, in the user's project, as the user. Installing a plugin from this marketplace means trusting this repository's maintainers and everything merged into `main`.

Current attack surface of the four plugins: **no hooks, no MCP servers, no bundled scripts or binaries.** Everything is Markdown instructions plus manifests. The risk is therefore what the agents are allowed to do:

| Agent | Plugin | Model | Tools | Can change files |
|---|---|---|---|---|
| `researcher` | research-tools | sonnet | Read, Glob, Grep, Bash, WebSearch, WebFetch | No (Bash restricted to inspection by its prompt) |
| `architecture-reviewer` | architecture-review | sonnet | Read, Glob, Grep, Bash | No (Bash restricted by its prompt) |
| `plan-verifier` | sdd-engineering | sonnet | Read, Glob, Grep, Bash | No (Bash restricted by its prompt) |
| `implementation-planner` | sdd-engineering | opus | Read, Glob, Grep, Bash, Skill, Write | Plan files (Bash restricted by its prompt) |
| `spec-creator` | sdd-engineering | opus | Read, Glob, Grep, Bash, Skill, Write, Edit, Agent | Spec files; may call only `researcher` |
| `implementer` | sdd-engineering | sonnet | Read, Glob, Grep, Edit, Write, Bash, Skill, TodoWrite | Yes, feature code |

Two things to remember when reading the table. First, "Bash restricted by its prompt" is an instruction, not enforcement: a read-only agent that has `Bash` can in principle run any command the session allows. `researcher` is the only one whose read-only behavior is covered by an eval (`refuses-to-write`). Second, `WebFetch` and `WebSearch` in `researcher` send queries to external services and read untrusted web content, which can contain prompt injection. Treat its external findings as data.

## Rules for contributors

- No secrets or credentials in manifests, skills, agents, evals or scripts.
- No absolute paths; use `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_SKILL_DIR}`.
- Give each agent the smallest tool list that works. Adding `Write`, `Edit`, `Agent`, `WebFetch` or `Bash` to an agent needs a reviewer's explicit sign-off in the PR (see the PR checklist in [CONTRIBUTING.md](../CONTRIBUTING.md)).
- Hooks and MCP servers are not accepted without a separate security review: they run code or contact services outside the model's tools. Plugin agents ignore `hooks` and `mcpServers` in their own frontmatter, so they must be declared at plugin level if ever needed.
- Third-party content must have a verified license and recorded origin before release (see `plugins/engineering-paved-path/THIRD_PARTY.md`, currently "to verify" for most skills).
- The catalog site renders repository Markdown: always sanitize it (DOMPurify), make no requests to third-party origins at runtime.

## Release safety

- A tag `<plugin>--v<version>` is immutable and must point at a commit that passed CI. Never move or delete a published tag; ship a new version instead.
- Evals are run with `--trust-plugin --scaffold`, which execute the suite's `fixture.sh` as the person running them. Only run suites you or your team wrote.

## Reporting a vulnerability

Do not open a public issue for a security problem. Contact the maintainers listed in [CODEOWNERS](../CODEOWNERS) directly, or use GitHub's private vulnerability reporting (Security tab, "Report a vulnerability") once it is enabled for this repository. Include the plugin, version, and what an attacker could do.

## After an unsafe release

Use this when a published version leaks a secret, requests too many permissions, or behaves harmfully. Tags are immutable, so the fix is a new version plus a rollback channel for everyone already on the bad one.

1. **Stop the spread.** Pin the stable channel to the last good tags so anyone rolling back gets a safe version:
   ```bash
   node scripts/pin-stable.mjs <plugin>@<last-good-version> ... --publish
   ```
   Pin the whole dependency set, not one plugin. A plugin pinned on its own can leave its dependents unable to load.
2. **Fix forward.** Merge a fix and release a new patch version, dependencies first ([RELEASES.md](RELEASES.md)). Add a `CHANGELOG.md` entry that says what was wrong and which versions are affected. Do not reuse or move the bad tag.
3. **Tell users.** State the affected versions and the fix version in the release notes and the changelog, and tell consumers how to move:
   - fixed version: `claude plugin marketplace update dev-digest-ai-marketplace` then `claude plugin update <plugin>@dev-digest-ai-marketplace`;
   - need the last good one now: `scripts/switch-channel.sh <plugin> stable --scope project` (roll back every plugin of the dependency set, and remove duplicate copies from the latest channel afterwards).
4. **Rotate secrets.** If anything secret was exposed, treat it as compromised: revoke and replace it first, then clean the history. Removing it from a later commit does not un-publish it from existing tags and clones.
5. **Verify.** In a consumer project run `claude plugin list --json` (no errors, expected versions) and the smoke evals in `evals/` against the fixed version.
6. **Record it.** Add what happened and what changed in the process to the changelog or a short post-mortem.
