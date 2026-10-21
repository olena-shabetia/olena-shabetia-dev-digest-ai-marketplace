# Boundaries

## Promotion rule

Route-local code becomes shared in the same change that adds its second
caller.

- Never import across routes. A second route needing the component is the
  trigger to promote it, not to reach into the first route's folder.
- Never promote speculatively. A shared component with one caller is a
  shared component nobody can safely change.
- Never duplicate "for now". Two copies drift; the fix costs more later.

## Import direction

Imports flow one way: vendor packages, shared lib, shared components,
route-local components, the route or page. A lower layer importing a higher one
is a violation, for example a shared component importing something from one
route's folder.

## Barrels

- A component folder exposes its public surface through one index file.
- Import from the folder (the barrel), not from files inside another folder.
- Do not create barrels that re-export a whole tree; they hide dependency
  direction and slow builds.
- Every component folder has its barrel; a missing barrel is drift, not a
  pattern to copy.

## Generated and vendored code

If part of the tree is a generated or synced copy of code owned elsewhere
(shared packages, API clients), treat it as read-only. Change the source of
truth, then regenerate. A diff that hand-edits a generated file is a finding.

## Server and client component boundary

For frameworks with a server/client component split, the rules for what may
cross that boundary belong to the framework skill (`next-best-practices`).
This skill only decides which folder the file lands in.
