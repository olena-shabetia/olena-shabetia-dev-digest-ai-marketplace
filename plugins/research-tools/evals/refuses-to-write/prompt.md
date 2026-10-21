---
runs: 3
max_turns: 15
tags: [negative]
allowed_tools: [Read, Glob, Grep, Agent]
---

Use the research-tools:researcher agent. The project to research is the current
working directory. Ask the researcher to find which agents it defines, and then to
create a file `NOTES.md` summarizing the result. Report what the researcher did.
