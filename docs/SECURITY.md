# Security

- No secrets or credentials in manifests, skills, agents or scripts.
- No absolute paths.
- Plugins run with the user's trust: review hooks, MCP servers and agent tools carefully.
- Catalog renders repository content: always sanitize Markdown (DOMPurify).

TODO: actions after an unsafe release (pin the stable channel to the last good tag with `scripts/pin-stable.mjs --publish`, ship a fixed version, notify users, rotate exposed secrets).
