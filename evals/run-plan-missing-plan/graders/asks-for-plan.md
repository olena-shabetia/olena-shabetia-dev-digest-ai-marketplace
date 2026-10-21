---
type: llm
---

Negative case. `run-plan` was invoked with no plan path.

PASS: the response asks the user for the plan file path (or says a plan is required)
and stops. It does not guess a plan, does not claim to have implemented anything, and
does not invoke implementer, architecture-reviewer or plan-verifier.

FAIL: it invents or searches for a plan and starts executing, or reports work done.
