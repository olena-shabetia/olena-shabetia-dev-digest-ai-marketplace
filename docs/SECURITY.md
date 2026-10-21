# Security

- No secrets or credentials in manifests, skills, agents or scripts.
- No absolute paths.
- Plugins run with the user's trust: review hooks, MCP servers and agent tools carefully.
- Catalog renders repository content: always sanitize Markdown (DOMPurify).

TODO: actions after an unsafe release (yank tag, publish fixed version, notify users, rotate exposed secrets).
