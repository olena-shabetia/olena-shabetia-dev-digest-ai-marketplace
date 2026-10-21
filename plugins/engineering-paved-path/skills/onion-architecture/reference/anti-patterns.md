# Anti-patterns

Each entry: what it looks like, why it hurts, the fix. Confirm every instance
by opening the file before reporting it.

## Query inside a route handler

A route imports the ORM or database client and queries inline.
Hurts: the query cannot be reused or unit-tested without HTTP, and tenancy or
authorization scoping is easy to forget.
Fix: move the query into a repository method, call it from a service, and have
the route call the service.

## Business logic in a route

A handler computes derived fields, applies rules, or orchestrates several
repositories.
Fix: move the logic into the service; the route keeps only validation and status
codes.

## Service constructing its dependencies

`new SomeAdapter()` or a direct SDK import inside a service.
Hurts: tests cannot swap the dependency and the service is welded to a vendor.
Fix: depend on a port; resolve the implementation from the composition root.

## Vendor SDK outside adapters

An HTTP client, cloud SDK, or LLM SDK imported by a service, repository, or the
domain core.
Fix: declare a port for what the code needs, implement it in an adapter, call it
through the port.

## Framework or ORM leaking into the core

The domain core imports the web framework, the ORM, or reads the environment.
Hurts: the core stops being pure and cannot be reused or tested in isolation.
Fix: pass what the core needs as arguments or through a port.

## ORM rows returned across a boundary

A repository returns raw rows that routes serialize directly.
Hurts: schema changes become API changes; internal columns leak.
Fix: map rows to domain types or DTOs in a helper at the repository boundary.

## Module reaching into another module's internals

A service imports another module's repository or container field.
Fix: depend on a port or a shared contract, or expose a public function from the
owning module.

## Circular dependencies

Two modules import each other.
Fix: extract the shared concept into a port or shared module that both depend
on.

## A deliberate exception is not drift

Before reporting a violation, check for a comment, an ADR or a documented rule
that states why the exception exists (for example a pass-through repository in a
trivial module). Report undocumented exceptions; list documented ones under
"Not a finding".
