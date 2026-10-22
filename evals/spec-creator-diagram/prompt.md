---
plugins: ["../../plugins/sdd-engineering", "../../plugins/engineering-paved-path", "../../plugins/research-tools", "../../plugins/architecture-review"]
runs: 3
max_turns: 30
timeout_seconds: 600
tags: [quality-gate]
allowed_tools: [Read, Glob, Grep, Write, Edit, Skill]
---

Use the sdd-engineering:spec-creator agent to write a spec for this feature: when an
order is placed (`src/orders`), billing creates an invoice for it (`src/billing`), and
once the invoice exists the user gets a confirmation email (`src/notifications`). The
request is complete, do not ask clarifying questions. Tell me the path of the spec file.
