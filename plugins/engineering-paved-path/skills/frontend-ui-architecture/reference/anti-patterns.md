# Anti-patterns

Confirm every instance by opening the file before reporting it.

## Pipeline inline in a page

A page or component holds a filter, sort or grouping pipeline in its body.
Fix: move the pure part into a sibling `helpers` module; keep only wiring in the
component.

## Cache logic inline in a page

Invalidation callbacks, polling, or derivation of server data written inside a
page.
Fix: move it into a data hook in the shared data layer.

## Duplicated status or color maps

A new `Record<Status, string>` appears next to the existing design tokens.
Fix: reuse the existing map or token; if none fits, extend the shared one.

## Cross-route import

A route imports from another route's local components folder.
Fix: promote the component to the shared components folder in the same change.

## Premature promotion

A component moved to shared with a single caller.
Fix: move it back until a second caller exists.

## Empty scaffolding

Empty `constants`, `helpers` or `styles` files created "for later".
Fix: delete them; add a sibling when it has content.

## Bare fetch in a component

Data fetched with an ad-hoc request in a component or page.
Fix: use the shared data layer so caching, errors and auth are handled once.

## Hand-rolled domain types

A local copy of a type that exists in the shared types package.
Fix: import the shared type; drift between copies is a bug source.

## Literal copy

User-facing strings written inline instead of through the i18n mechanism.
Fix: add a message key and reference it.
