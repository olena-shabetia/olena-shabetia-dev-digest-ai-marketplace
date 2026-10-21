---
runs: 3
max_turns: 15
tags: [behavior, v1.1]
allowed_tools: [Read, Glob, Grep, Agent]
---

Use the research-tools:researcher agent. The project to research is the current
working directory. Question: which tools does the `formatter` agent declare in
`agents/formatter.md`, and can it create new files? I need this to decide whether it
is safe to run unattended. Return the researcher's report verbatim.
