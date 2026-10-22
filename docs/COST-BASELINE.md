# Cost baseline

What one successful `spec-creator` run costs, measured with `claude plugin eval` (Claude Code 2.1.299), and the result of one optimization.

## Workflow measured

The cheapest workflow in `sdd-engineering`: `spec-creator` writes one spec for a small feature in a tiny fixture project. The full spec, plan, implement, verify chain is not measured here.

| Case | Task | Source |
|---|---|---|
| `spec-creator-smoke` | one function gets an optional argument; no diagram needed | `evals/spec-creator-smoke` |
| `spec-creator-diagram` | feature spans three modules (order, invoice, email); the spec must contain a Mermaid sequence diagram | `evals/spec-creator-diagram` |

## Baseline

Plugins: `sdd-engineering@1.0.0` with its three dependencies, repository commit `30dcc66`. Model: `claude-opus-5-5` (the agent's own `model: opus`). Judge: default (haiku).

| | `spec-creator-smoke` (5 runs) | `spec-creator-diagram` (3 runs) |
|---|---|---|
| Pass rate (all graders) | 100% | 67% (one run failed the LLM judge) |
| Cost per run, median (min-max) | $0.27 ($0.27-0.29) | $0.42 ($0.39-0.44) |
| Latency per run, median (API time) | 46 s | 85 s |
| Tool calls, median | 7 | 10 |
| Turns, median | 3 | 3 |
| Output tokens, median | 793 | 988 |
| Cache-write tokens, median | 10,156 | 10,375 |
| Critical errors | 0 | 0 |

Input tokens are near zero because the prompt is served from cache; the cache-write figure (about 10k tokens) is the agent prompt plus the four preloaded skills, about 24 KB of skill text.

## Optimization

**Change:** `spec-creator` no longer preloads `engineering-paved-path:mermaid-diagram` (7 KB). It loads the skill through `Skill` only when a spec has two or more cross-module hops. Everything else is unchanged.

**Quality gate:** the change is accepted only if all of these hold after it: `spec-creator-smoke` stays at 100%, `spec-creator-diagram` stays at 100% for the diagram check (so the diagram is still produced when needed), and no new failing grader.

**Result (3 runs per case):**

| | Before | After | Change |
|---|---|---|---|
| `spec-creator-smoke` cost, median | $0.27 | $0.25 | -7% |
| `spec-creator-smoke` pass rate | 5/5 | 3/3 | same |
| `spec-creator-diagram` cost, median | $0.42 | $0.50 | +19% |
| `spec-creator-diagram` latency, median | 85 s | 121 s | +36 s |
| `spec-creator-diagram` tool calls, median | 10 | 13 | +3 |
| `spec-creator-diagram` diagram present | 3/3 | 3/3 | same |
| `spec-creator-diagram` pass rate | 2/3 | 3/3 | see note |

The gate passed.

**Honest reading:** the saving is small and conditional. A spec without a diagram gets about $0.02 cheaper. A spec that needs a diagram gets about $0.08 more expensive and half a minute slower, because the model has to call `Skill` first. The change pays off only when fewer than about 20% of specs need a diagram. The pass-rate improvement on the diagram case (2/3 to 3/3) is judge noise, not an effect of the change: the one failure before was an LLM-judge vote on spec quality, unrelated to the diagram.

**Caveats:** the fixtures are tiny, so absolute numbers understate a real repository; 3 to 5 runs per case give medians, not confidence intervals; a first attempt at the "after" run hit a session limit and was discarded and re-run.

**Decision:** not released. The change is kept as a separate commit so it can be shipped (as a patch release of `sdd-engineering`) or dropped once the real mix of specs is known. Larger candidates not tried: loading `frontend-ui-architecture` on demand (riskier for design-driven specs) and a cheaper model for `spec-creator` (needs its own quality gate).

## Reproduce

```bash
claude plugin eval . --case 'spec-creator-*' --trust-plugin --scaffold --allow-tools Write Edit --no-publish --runs 3
```
