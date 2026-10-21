---
name: onion-architecture
description: >-
  Decides which backend layer (ring) a piece of code belongs to and who may
  import it — whether logic goes in a route/controller, a service, a
  repository, an adapter, a port, or a pure domain core; where a new
  port/adapter pair is declared; and how to keep web frameworks, ORMs and vendor
  SDKs out of the core. Use before adding a backend file, a query or an SDK
  call, when a module has no service or repository tier, when auditing which
  tiers every module has, and when reviewing a change for layer violations.
  Reads the repository's own architecture docs first and applies them over the
  defaults here. Does NOT cover web-framework APIs, ORM query syntax, or schema
  libraries (see fastify-best-practices, drizzle-orm-patterns, zod).
---

# Onion Architecture

This skill answers one question: **which ring does this code belong to, and
who is allowed to import it?** It is the backend counterpart to
`frontend-ui-architecture`.

## Step 0: find the repository's own layout

Before applying anything below, read the repository's architecture sources, in
this order, and stop at the first that defines the layers:

1. `CLAUDE.md` / `AGENTS.md` at the root and in the touched package.
2. `docs/architecture*`, `ARCHITECTURE.md`, ADRs.
3. Dependency-rule configuration (`.dependency-cruiser.*`, ESLint boundary
   rules, `tsconfig` paths) — it states the enforced rules.
4. The directory tree of an existing, well-formed module.

Where the repository names its layers or folders differently, use its names
and treat the layout below as the default vocabulary. If nothing documents the
layers, say so and apply the defaults, labelling findings "per default
layout".

## The rings

Coupling points inward only: inner layers define interfaces, outer layers
implement them (Palermo, [Onion Architecture part 1](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/)).

```
domain core        (pure: no I/O, no framework, no ORM)
  ← ports          (interfaces and data contracts the core and use cases need)
    ← repository   (queries; the only place that touches the database)
      ← service    (business rules and orchestration, no queries)
        ← routes   (transport: HTTP shape, input validation, no business logic)
adapters implement the ports ─┘ (wired only at the composition root)
```

| Ring | Responsibility | May import |
|---|---|---|
| Domain core | Pure transforms and rules | Nothing from outer rings; no framework or ORM |
| Ports | Interfaces for outbound integrations, shared contracts | Domain core |
| Repository | Queries, row-to-domain mapping | Ports, domain core, ORM |
| Service | Business rules, orchestration | Repository, ports, domain core |
| Routes | Transport, validation, status codes | Service, contracts |
| Adapters | Implement ports for vendor SDKs, clocks, secrets | Ports, vendor SDKs |
| Composition root | Builds adapters and services, the one place that knows concrete classes | Everything |

## Placement table

| Kind of code | Goes in |
|---|---|
| Transport shape, input validation, status codes | routes / controllers, no business logic |
| Orchestration, invariants, business rules | service, no queries |
| Any database query | repository, scoped by whatever the repository's tenancy rule requires |
| Pure transforms, row → DTO mapping | sibling `helpers` |
| Literals, thresholds | sibling `constants` |
| New outbound integration | port + adapter + a getter at the composition root + a test double |
| Cross-cutting (errors, config, jobs, logging) | a platform / shared module, not a feature module |
| Secrets | one provider behind a port; a single place reads the environment |

## Module tier audit

Use this when asked "which modules are missing a tier" or before a PR that adds
a module. Per-file placement answers one question; the audit answers the
whole-tree one.

For each feature module (skip shared and platform folders):

| Tier | Required when |
|---|---|
| routes | always |
| service | the module has any business rule or orchestration |
| repository | the module has any database query |

Apply these rules in order:

1. **Routes importing the database** — a route file that imports the ORM or
   database client is a violation, whatever else the module has.
2. **Queries without a repository** — any query outside a repository file is a
   violation; the module needs a repository.
3. **Routes without a service** — a module whose routes do business or
   database work and has no service is missing the service tier.
4. **Service without a repository** — a service that imports the database
   directly is a violation.

Collect the raw table with `ls` and `grep` over the module folders. Read the
output as evidence, not the verdict: a module with no repository and no query
is fine, and a `repository/` folder counts as the repository tier. Open each
flagged line before reporting it with `file:line`.

## Adding a port and adapter

1. Declare the interface in the shared ports location (one canonical copy).
2. Implement it in an adapter folder.
3. Expose it through the composition root, with an override seam for tests.
4. Add a test double so tests can swap it in.

## Pre-flight checklist

Copy this and tick off before finishing a backend change:

```
- [ ] Adding a query? Is there a repository? If the module has none, create
      it; do not add a second inline query.
- [ ] Is the query scoped the way the repository's tenancy rule requires?
- [ ] New SDK import? Does it belong in an adapter behind a port?
- [ ] Service constructing a concrete adapter? Resolve it from the
      composition root instead.
- [ ] Importing another module's internals? Go through ports, platform, or
      shared contracts.
- [ ] Touching the domain core? Still no I/O and no framework imports?
- [ ] Returning an ORM row outward? Map it to a DTO.
- [ ] Ran the repository's dependency-rule check (see reference/enforcement.md)?
- [ ] New or touched module? Run the tier audit.
```

## Reference

- [reference/anti-patterns.md](reference/anti-patterns.md) — common drift and
  the fix.
- [reference/enforcement.md](reference/enforcement.md) — turning the rules into
  a failing check, and how to treat baselines.
- [reference/sources.md](reference/sources.md) — foundational reading and the
  counterpoint on repositories.
