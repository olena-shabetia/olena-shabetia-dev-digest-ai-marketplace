# Releases

## Versioning and tags

- SemVer, set only in `plugins/<name>/.claude-plugin/plugin.json`. Never set `version` in the marketplace entry.
- Tags follow `<plugin>--v<version>`, for example `sdd-engineering--v1.0.0`. A tag is immutable and must point at a commit that passed CI.
- Every release needs a `## <version>` heading in the plugin's `CHANGELOG.md`.
- Release order: dependencies first, then consumer plugins.

## Cutting a release

```bash
node scripts/release.mjs engineering-paved-path          # preflight + dry run
node scripts/release.mjs engineering-paved-path --push   # create and push the tag
```

The script blocks the release unless: manifest and marketplace entry agree, the changelog documents the version, the tree is clean and HEAD is on `origin/main`, the tag is free, every dependency already has a tag satisfying its range, `claude plugin validate` passes, and `validate.yml` is green for HEAD (`--skip-ci` bypasses the last check).

## Updating a consumer project

```bash
claude plugin marketplace update dev-digest-ai-marketplace
claude plugin update sdd-engineering@dev-digest-ai-marketplace --scope project
```

Then start a new session or run `/reload-plugins`. Updating the catalog and updating the plugin are separate steps.

## Release channels and rollback

Claude Code has no `plugin rollback` command and no channel concept. The `latest` channel is this marketplace. The `stable` channel is a second marketplace, `dev-digest-ai-marketplace-stable`, whose entries are pinned to release tags and commit SHAs. It lives on the `stable` branch of this repository.

Prepare it before you need it:

```bash
node scripts/pin-stable.mjs sdd-engineering@1.0.0 engineering-paved-path@1.0.0 \
  research-tools@1.0.0 architecture-review@1.0.0 --publish
```

Without arguments, every plugin is pinned to its highest tag. `--publish` adds a normal commit to the `stable` branch (no force push). Use `--out <file>` to inspect the result first.

Roll back in a consumer project:

```bash
export MARKETPLACE_REPO=olena-shabetia/olena-shabetia-dev-digest-ai-marketplace
scripts/switch-channel.sh sdd-engineering stable --scope project
```

The script registers the stable marketplace, uninstalls the latest copy with `--keep-data` (plugin data is preserved), installs from stable, and prints the installed version. Then start a new session or run `/reload-plugins` and run the smoke eval.

Return to latest only after the rollback is verified: `scripts/switch-channel.sh sdd-engineering latest --scope project`.

Never run `claude plugin marketplace remove` on the channel you are leaving: it also deletes its plugins' data.

If a plugin changed external state (files, services, databases), its recovery is not covered by these commands. Describe it in the plugin's `COMPATIBILITY.md`.

## Unsafe release

See [SECURITY.md](SECURITY.md).
