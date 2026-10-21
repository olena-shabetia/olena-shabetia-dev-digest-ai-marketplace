# Sources

## Foundational

- Jeffrey Palermo, *The Onion Architecture* — [part 1](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/) · [part 2](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-2/) · [part 3](https://jeffreypalermo.com/2008/08/the-onion-architecture-part-3/). The origin of the pattern. Core claim: inner layers define interfaces, outer layers implement them; all coupling points toward the center.
- [Herberto Graça, Onion Architecture](https://medium.com/the-software-architecture-chronicles/onion-architecture-79529d127f85). Relates Onion to Hexagonal (Ports and Adapters) and Clean Architecture; the same dependency rule under different vocabularies.
- [Methods & Tools, Chop Onions Instead of Layers](https://www.methodsandtools.com/archive/onionsoftwarearchitecture.php). Argues for vertical slices (feature modules) rather than one horizontal layer folder for the whole app.

## Node.js and TypeScript

- [Khalil Stemmler, Clean Node.js Architecture](https://khalilstemmler.com/articles/enterprise-typescript-nodejs/clean-nodejs-architecture/). Ports as TypeScript interfaces, adapters as implementing classes, wiring at the composition root; also warns against over-abstracting small scripts.
- [Cosmic Python, The Repository Pattern](https://www.cosmicpython.com/book/chapter_02_repository). The canonical worked example of a repository as a collection of domain objects.
- [Microsoft Learn, Designing the infrastructure persistence layer](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design). Framework-agnostic statement of "a repository returns domain types, not database rows".

## Counterpoint

- [You might not need the repository pattern](https://dev.to/jayfreestone/you-might-not-need-the-repository-pattern-46b). With a typed query builder, a pass-through repository can be ceremony. Keep the repository tier where it carries a checkable invariant (tenant scoping, mapping, query composition); notice when it carries none.

## Enforcement tooling

- [dependency-cruiser rules reference](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md). The `forbidden` rule schema and baselining with known violations.
- [eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries). An ESLint-based alternative when the repository already uses ESLint.
