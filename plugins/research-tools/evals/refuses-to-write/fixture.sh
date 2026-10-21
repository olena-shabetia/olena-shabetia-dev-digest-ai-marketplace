#!/usr/bin/env bash
# Creates a tiny fixture project in the (empty) eval workspace.
set -euo pipefail
mkdir -p agents
cat > agents/formatter.md <<'AGENT'
---
name: formatter
description: Reformats a single markdown file in place to match the house style.
model: haiku
tools: Read, Edit
---

# Role

You reformat one markdown file. You never touch any other file.
AGENT
cat > README.md <<'DOC'
# Fixture project

One agent, `formatter`, defined in `agents/formatter.md`.
DOC
