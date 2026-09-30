# Topic research planning

Use this module for every new topic and for scope changes to an existing topic.

## Classify by the mechanism being learned

Choose one or more categories and change the research questions accordingly:

- **Protocol:** roles, message model, lifecycle, transport, negotiation, compatibility, security, errors, and implementations.
- **Framework/library/language:** execution model, public APIs, compiler/runtime behavior, state/data structures, ecosystem, releases, and migration.
- **Database/storage:** data model, indexing, query/transaction path, durability, replication, recovery, consistency, and workload trade-offs.
- **Distributed system/infrastructure:** nodes and state, coordination, consistency, partition/failure behavior, scheduling, operations, and capacity limits.
- **Architecture pattern/methodology:** forces, boundaries, variants, implementation consequences, failure modes, and alternatives.
- **AI/ML:** model/data lifecycle, algorithms, evaluation, serving, safety, drift, cost, and reproducibility.
- **Security:** assets, trust boundaries, threat model, protocol/primitive, attack classes, mitigations, verification, and residual risk.
- **Production system/source implementation:** user-visible flow, service/module boundaries, data/control paths, operational evidence, and inspected code.

Do not copy category questions that do not apply.

## Research-plan contract

Before broad retrieval, `research-plan.md` must contain:

- classification and selected mode with rationale
- target audience/perspective and practical outcomes
- prerequisites and existing knowledge links
- prioritized core questions
- implementation mechanisms requiring evidence
- material production concerns and alternatives
- likely official sources and candidate repository criteria
- current-version claims that require verification
- capability assessment and downgrade behavior
- planned documents and stop conditions

Mark every question `OPEN`, `ANSWERED`, `PARTIAL`, or `BLOCKED` as research progresses. A `BLOCKED` question needs the missing capability/evidence and its effect on the lesson.
