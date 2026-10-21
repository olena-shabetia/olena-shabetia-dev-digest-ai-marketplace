---
plugins: ["../../plugins/sdd-engineering", "../../plugins/engineering-paved-path", "../../plugins/research-tools", "../../plugins/architecture-review"]
runs: 1
max_turns: 25
timeout_seconds: 600
tags: [smoke]
allowed_tools: [Read, Glob, Grep, Write, Edit, Skill]
---

Use the sdd-engineering:spec-creator agent to write a spec for this feature: the
`greet` function in `src/greet.ts` must accept an optional `greeting` argument
(default "Hello") so callers can write `greet("Ada", "Hi")`. Keep it small. Do not
ask clarifying questions; the request is complete. Tell me the path of the spec file.
