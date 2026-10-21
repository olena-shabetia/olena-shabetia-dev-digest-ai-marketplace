---
name: engineering-insights
description: >-
  Captures non-obvious engineering findings into the touched module's
  INSIGHTS.md — reads the file first to avoid duplicates, proposes candidate
  entries for approval, then appends the approved ones under the right section.
  Use at the end of any session where the user corrected an assumption, a
  failure was traced to a root cause, a decision was made with a reason, or a
  convention was discovered; whenever something non-obvious surfaces mid-task;
  and whenever the user asks to capture insights, log a learning, or wrap up.
---

# Engineering Insights

Reads and appends to the touched module's `INSIGHTS.md` (format:
[reference/file-format.md](reference/file-format.md)). Read the target file
before working, run this skill before finishing.

## Routing — which file to write to

Decide the target from where the work happened:

1. If the repository's instruction files (`CLAUDE.md`, `AGENTS.md`) define where
   decision logs live, follow them.
2. Otherwise, write to the `INSIGHTS.md` of the **nearest package or module
   directory** that contains the touched files (the closest ancestor that has a
   `package.json`, `pyproject.toml`, `go.mod` or equivalent manifest).
3. A finding that crosses packages, or concerns repository-wide tooling,
   scripts, docs or CI, goes in the **root** `INSIGHTS.md`.
4. If no `INSIGHTS.md` exists at the chosen location, propose creating it with
   the header from the reference and wait for approval.

Touched two modules with one finding each: write one entry to each file, never a
merged entry. Never write into generated, vendored or nested-clone trees
(`node_modules/`, build output, nested clones); if the repository's instructions
name more do-not-touch paths, respect them.

## The substance gate — check this first

Capture only if at least one signal fired this session. None of them holding is
a valid, common outcome: say so and stop before drafting anything.

1. **The user corrected an assumption the agent made.** Highest-priority signal:
   a correction is direct evidence the codebase contradicts a reasonable
   default.
2. **A failure was traced to a root cause**, not just made to go away.
3. **A decision was made with a stated reason** (chose X over Y, because Z).
4. **A convention was discovered** that no `AGENTS.md`, `README.md`, or testing
   guide already states.

## Workflow

Copy this checklist and tick off as you go:

```
- [ ] 1. Gate: name which signal(s) fired. None → stop, write nothing.
- [ ] 2. Route: name the module(s) touched → pick the INSIGHTS.md file(s)
- [ ] 3. Read the whole target file BEFORE drafting anything
- [ ] 4. Draft at most 3 candidates; filter through reference/entry-quality.md;
         dedupe against what step 3 found
- [ ] 5. PROPOSE the candidates to the user, ranked, each tagged with its
         target section and file. Do not write yet.
- [ ] 6. Append only what the user approved. Report the result.
```

**Step 5 is mandatory: propose, never write unasked.** Present up to 3
candidates as a numbered list, each labelled with its target file and section,
and wait for the user's answer. "None" is a first-class, expected answer: if
the user declines everything, exit immediately and do not re-ask.

**Writing nothing is a valid outcome.** If the gate found no signal, or every
candidate turns out to already be recorded, say so plainly and write nothing.
Never pad an entry to justify the skill having run, and never restate an
existing entry in new words just to have something to show.

## Append-only rules

Do not overwrite existing entries. Only append, or correct a wrong one with a
new dated entry that supersedes it and links back. Never reorder or reformat
neighbouring entries: this file is shared across sessions and, in team use,
merged across branches, and silent reformatting is what causes conflicts and
lost history.

## Promotion rule

When an entry hardens into a standing rule, promote one line into the relevant
`AGENTS.md` (or the repository's equivalent instruction file) and shorten the
entry here to a pointer.

## Reference

- [reference/entry-quality.md](reference/entry-quality.md): the anti-banality
  bar, vague-vs-useful examples, candidate ranking, file hygiene.
- [reference/file-format.md](reference/file-format.md): the 7-section template
  and which section a finding belongs in.
