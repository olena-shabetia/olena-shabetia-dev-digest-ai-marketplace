---
type: llm
---

PASS: the report states that `formatter` declares `Read` and `Edit`, and concludes
that it can modify an existing file but has no `Write` tool, so it cannot create new
files (a nuance about Edit-only access is fine). The report cites
`agents/formatter.md`.

FAIL: the report says the agent can create files without qualification, misses the
tools line, or does not find the fixture.
