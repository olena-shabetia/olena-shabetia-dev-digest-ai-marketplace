# Enforcement

Rules that nothing checks decay. Find out what the repository already enforces
before proposing anything.

## Find the existing gate

Look for, in this order:

- a dependency-rule config (`.dependency-cruiser.*`, `depcruise` scripts),
- ESLint boundary rules (`eslint-plugin-boundaries` or `no-restricted-imports`),
- `tsconfig` path constraints and project references,
- a `package.json` script named like `arch`, `lint:arch`, or `deps`.

Run the repository's own command; do not invent one. If it can be scoped to the
change, scope it. If it is read-only, prefer the verbose output form so the
evidence includes the violating import.

## Reading a violation

Each violation names a rule, the importing file, and the imported file. Open the
importing file and confirm the line before reporting it. A violation is a
finding only if the import exists at that line.

## When the checker cannot resolve imports

If the tool reports unresolvable imports, treat the rest of its output as
unreliable and say so. Never report "clean" on a run that could not resolve
modules.

## Baselines

Many repositories keep a file of known violations so the gate can pass while
debt is paid down.

- A baseline entry is not a new finding unless the change made it worse.
- Never regenerate or overwrite the baseline as part of a review. Re-baselining
  after a fix is a deliberate commit by the owner.

## If nothing is enforced

Report the rules you applied as "per default layout" and suggest, as a
follow-up, adding one of the checks above. Do not add tooling inside an
unrelated change.
