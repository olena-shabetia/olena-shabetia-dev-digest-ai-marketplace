# research-tools

A read-only research agent. Ask it a specific question and it answers with cited evidence, either from your repository or from the web, and tells you what it could not find.

## Install

```bash
claude plugin marketplace add olena-shabetia/olena-shabetia-dev-digest-ai-marketplace
claude plugin install research-tools@dev-digest-ai-marketplace
```

No dependencies.

## What you get

| Agent | Model | Tools | Purpose |
|---|---|---|---|
| `research-tools:researcher` | sonnet | `Read`, `Glob`, `Grep`, `Bash` (read-only), `WebSearch`, `WebFetch` | Answers one question with `file:line` citations or dated URLs, and lists what it could not find |

## How to use it

Ask Claude in plain words ("research where retries are configured", "check what the upstream docs say about X"), or call the agent directly:

```text
@agent-research-tools:researcher How does the checkout service validate coupons, and when was that last changed?
```

Give it a concrete question and say why you need the answer. If the question is only a topic, or the goal is unclear, it returns up to three clarifying questions instead of researching. It has no way to wait for your reply inside one run; answer and call it again.

## Modes

Every report starts with one mode line:

| Mode | When |
|---|---|
| `Mode: repo` | The answer lives in this repository |
| `Mode: external` | The answer lives in docs, changelogs or source of other projects |
| `Mode: mixed` | The question spans both; one answer, two evidence tables |
| `Mode: clarification needed` | The question or its goal is unclear |

## Guarantees

- It never writes, edits or runs builds. `Write`, `Edit` and `NotebookEdit` are not in its tool list, and Bash is limited to inspection (`git log`, `rg`, `ls`, `jq`, ...).
- Every claim has a location it opened. External sources are labelled primary or secondary and dated.
- Every report has a `## Not found` section, even when it is only "nothing".
- It distinguishes "this does not exist" from "I did not find it".

## Report shape

```text
Mode: repo (<why>)
Question: <restated>
## Answer
## Confidence
## Evidence        (table of claim / location / what it shows)
## How I searched
## Not found
## Caveats
## Follow-ups     (optional, up to 3 next questions)
```

## Used by

`sdd-engineering` delegates external lookups from `spec-creator` to this agent. It is useful on its own in any repository.

## Versioning

SemVer, tags `research-tools--v<version>`. See [CHANGELOG.md](CHANGELOG.md).
