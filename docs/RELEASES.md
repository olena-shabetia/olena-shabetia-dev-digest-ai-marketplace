# Releases

- SemVer in `plugin.json`.
- Tags: `<plugin>--v<version>` (e.g. `sdd-engineering--v1.0.0`), created with `claude plugin tag --dry-run` / `--push` from the plugin directory.
- Release order: dependencies first, then consumer plugins.

TODO (lab steps 9 and 11): update flow, release channels (stable marketplace pinned by ref/SHA), rollback procedure.
