---
plugins: ["../../plugins/sdd-engineering", "../../plugins/engineering-paved-path", "../../plugins/research-tools", "../../plugins/architecture-review"]
runs: 3
max_turns: 8
tags: [negative, smoke]
allowed_tools: [Read, Glob, Grep, Skill, Agent]
---

/sdd-engineering:run-plan
