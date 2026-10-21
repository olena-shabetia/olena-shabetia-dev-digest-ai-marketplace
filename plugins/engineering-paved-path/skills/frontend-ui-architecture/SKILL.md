---
name: frontend-ui-architecture
description: >-
  Decides where frontend code belongs and who may import it — which folder a
  component, hook, constant, style, helper or type goes in, when to split a
  component into siblings or a nested folder, when to promote route-local code
  to the shared layer, and where business logic lives. Use before creating a
  frontend file, when a component or page is growing, when choosing between a
  route-local and a shared component, when a helper or constant needs a home,
  or when reviewing a change for structural drift. Reads the repository's own
  frontend conventions first and applies them over the defaults here. Does NOT
  cover React internals, hooks rules, state or rendering (see
  react-best-practices) or Next.js file conventions (see next-best-practices).
---

# Frontend UI Architecture

This skill answers one question: **where does this file go, and who is
allowed to import it?** It is scoped to placement and organization only.

| Question | Answer lives in |
|---|---|
| Where does this file go / who imports it | this skill |
| Should this be state, memo, effect, derived | `react-best-practices` |
| `page`/`layout`/`loading`, route groups, dynamic segments | `next-best-practices` |
| Backend layering | `onion-architecture` |

## Step 0: find the repository's own conventions

Before applying the defaults, read, in order, and stop at the first that
defines the frontend layout:

1. `CLAUDE.md` / `AGENTS.md` at the root and in the frontend package.
2. `docs/` pages about UI architecture, component conventions, ADRs.
3. The directory tree of an existing, well-formed feature.
4. Import-restriction config (ESLint, dependency-cruiser, `tsconfig` paths).

Where the repository uses different folder names, use its names. If nothing is
documented, apply the defaults below and label findings "per default layout".

## Placement table (defaults)

| Kind of code | Goes in |
|---|---|
| UI used by exactly one route or feature | a folder local to that route or feature |
| UI used by two or more routes or features | the shared components folder |
| UI primitive (button, badge, chart) | **don't write one**; check the design-system package or barrel first |
| Server data access | a shared hooks/data layer, never an ad-hoc `fetch` in a component |
| Pure derivation or formatting, feature-scoped | sibling `helpers` |
| Pure derivation, app-wide | shared `lib` utilities |
| Thresholds, maps, timings, geometry | nearest `constants` sibling |
| Inline style objects | sibling `styles` module |
| Domain types | the shared types package; never hand-rolled copies |
| UI-only view types | shared `types` or colocated with the single consumer |
| User-facing copy | the repository's i18n messages, never literals in components |
| Cross-cutting policy (errors, theme, toasts) | shared providers |

## Folder shapes

A component folder holds the component file and an index barrel; `styles`,
`constants` and `helpers` are optional siblings. Add one only when it carries
real content. **Never scaffold an empty sibling.** Nest as deep as the feature
needs; do not flatten to one level.

## When to split

- Extract `constants` / `helpers` / `styles` the moment the component body
  would otherwise hold a lookup map, a pure function, or an inline style
  object, not before.
- Extract a nested child folder when a JSX subtree earns its own name and could
  be tested in isolation.
- Size and prop-count limits belong to `react-best-practices`; this skill only
  says where the split lands.

## Business-logic ladder

Logic sinks as far down this ladder as it can go:

1. **Server**: derived domain fields, orchestration, anything the backend
   produces. The client never recomputes them.
2. **Data hooks**: server state, cache invalidation, polling, streaming.
3. **`helpers`**: pure, framework-free, testable without layout.
4. **Component body**: composition and event wiring only.

## Import direction

```
vendor packages
  ← shared lib  ←  shared components  ←  route-local components  ←  route/page
```

- A route-local component may never be imported by another route. **Promote**
  it to the shared components folder in the same change that adds the second
  caller. Never promote speculatively and never duplicate "for now".
- Generated or vendored copies are never authored directly; edit the source and
  regenerate.

## Before adding a frontend file

- [ ] Does this UI already exist in the design system or shared components?
- [ ] Is this the second consumer of a route-local component? Promote it now.
- [ ] About to write a color or status map? Search for an existing one first.
- [ ] Is this business logic? Walk the ladder before it lands in a component.
- [ ] Does this fetch data? Use the shared data layer.
- [ ] Adding a sibling file? Only if it has real content.
- [ ] User-facing string? Use the i18n mechanism, not a literal.

## Reference

- [reference/boundaries.md](reference/boundaries.md) — promotion rule, import
  direction, barrel policy.
- [reference/anti-patterns.md](reference/anti-patterns.md) — common drift and
  the fix.
