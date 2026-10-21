---
type: llm
---

PASS: the response names a spec file under `specs/`, the agent ran without errors
about missing skills or dependencies, and the described spec covers the optional
`greeting` argument with a default of "Hello" using EARS-style requirements
(WHEN/IF ... THE SYSTEM SHALL ...) or a clearly equivalent acceptance-criteria form.

FAIL: no spec path is given, the agent reports it could not load a skill or
dependency, or it edited `src/greet.ts` (specs only; feature code is off limits).
