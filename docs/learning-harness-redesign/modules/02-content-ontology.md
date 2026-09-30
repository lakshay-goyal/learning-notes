# Module 2 — Domains, fields, skills, topics, modules, and pages

## Learning objective

After this module, you should be able to classify knowledge into stable entities and choose which relationships should be hierarchical and which should be many-to-many.

## The problem with one folder tree

A folder tree is useful for human navigation, but it is a poor universal database. Topics belong to more than one field. Skills cross domains. A tool can belong to several learning paths. A single concept can be reused by many topics.

The current top-level categories mix levels:

- `AI Engineering` behaves like a domain.
- `System Design` behaves like a field or skill.
- `DevOps` can be a field or practice.
- `Tools` is a container, not a knowledge domain.
- `Git`, `Linux`, and `Docker` are tools or topics.

Trying to place every entity in one tree creates duplicate pages and arbitrary decisions.

## The canonical entities

### Domain

A broad, durable area of knowledge.

Examples:

- Software Engineering
- AI Engineering
- Mobile Development
- DevOps
- Design
- Human Skills

A domain is a navigation and reporting boundary, not a claim that every subtopic has the same depth.

### Field

A meaningful specialization inside a domain.

Examples:

- Backend Engineering
- Distributed Systems
- AI Agent Systems
- Data Engineering
- Platform Engineering
- Interaction Design

A field should have a coherent set of methods, questions, and learning paths.

### Learner skill

An observable capability the learner is trying to develop.

Examples:

- trace a distributed request
- design a trust boundary
- debug a race condition
- write a TypeScript API
- explain a trade-off under constraints

A skill is not a folder. It is a capability with evidence.

### Tool

A specific instrument or platform used to apply a skill.

Examples:

- Git
- Docker
- Linux
- Terraform
- Playwright

A tool can support many skills and can be taught through many topics.

### Topic

A bounded subject with its own prerequisites, version boundary, research plan, and mastery evidence.

Examples:

- Model Context Protocol
- Event loop semantics
- Kubernetes controllers
- Database indexes

A topic is the main unit users return to and maintain over time.

### Module

A dependency-ordered cluster inside a topic.

A module usually shares:

- a mental model;
- a prerequisite set;
- a practical activity;
- a coherent assessment.

### Concept

An atomic reusable idea, such as “ambiguous side effect” or “protocol session.” A concept has a stable ID and can appear in several modules or pages.

### Page

A route optimized for one learning job. A page teaches one dominant objective or a tightly coupled set of objectives. It is a presentation unit, not the definition of knowledge.

### Lab

An executable or otherwise reproducible practice artifact with an objective, inputs, expected behavior, and evidence.

### Assessment

A question or task that tests an objective: recall, prediction, debugging, architecture, implementation, or transfer.

## Which relationships are hierarchical?

Use a primary hierarchy for navigation:

```text
Domain → Field → Topic → Module → Page
```

Use many-to-many links for capabilities and paths:

```text
Topic → Skills
Topic → Tools
Topic → Concepts
Topic → Learning paths
Topic → Assessments
Topic → Evidence
```

Do not create a physical copy of a topic for each skill.

## Why stable IDs matter

Names change. A field may be renamed, a topic may be recategorized, and a route may move. Stable IDs let the system update labels and routes without breaking references.

Bad:

```text
prerequisites:
  - TypeScript and asynchronous I/O
```

Better:

```yaml
prerequisiteTopicIds:
  - typescript-async-runtime
prerequisiteConceptIds:
  - event-loop-basics
```

The human-readable explanation can remain beside the ID.

## A worked example: MCP

| Entity | Example |
| --- | --- |
| Domain | AI Engineering |
| Fields | Agent Integration, Distributed Protocols |
| Skills | Protocol design, TypeScript, API security, distributed tracing |
| Tools | TypeScript SDK, Inspector, test harnesses |
| Topic | Model Context Protocol |
| Modules | Boundary, lifecycle, transports, authorization, reliability, SDK internals |
| Pages | Overview, tool call, security, source map, practice, review |
| Concepts | Trust boundary, protocol era, idempotency, structured output |
| Labs | Local typed tool, tenant-safe HTTP server, idempotent gateway |
| Assessments | Trace a call, classify a timeout, design a guarded write |

The same topic can later appear under a new field without duplicating its content.

## Path design

A learning path is an ordered graph, not just a list.

```text
TypeScript fundamentals
  → HTTP and JSON-RPC
  → MCP boundary
  → MCP transports
  → Authorization and security
  → Reliable production gateway
```

A path should expose why each topic comes next and which objective it unlocks.

## Interactive classification

Classify these examples:

| Example | Entity or entities | Why? |
| --- | --- | --- |
| Docker | ? | |
| Debugging | ? | |
| HTTP/2 flow control | ? | |
| API security | ? | |
| “Trace a request through a gateway” | ? | |
| TypeScript event loop | ? | |
| Backend engineering | ? | |
| A runnable authorization middleware project | ? | |

<details>
<summary>Reveal guidance</summary>

A strong classification can contain more than one entity. Docker is a tool; API security is a field/skill; “trace a request” is a skill/objective; a runnable middleware project is a lab. The model should use relationships rather than force a single parent.

</details>

## Checkpoint

<details>
<summary>Should a topic be duplicated under every field where it is useful?</summary>

**Answer:** No. Keep one canonical topic and attach multiple typed relationships. Duplicate pages create drift, inflated counts, conflicting progress, and ambiguous source truth.

</details>

## Takeaways

- Domain and field support primary navigation.
- Skills, tools, concepts, and paths are cross-cutting.
- Topic is the durable learning object.
- Module organizes a topic; page optimizes one learning job.
- Stable IDs make taxonomy evolution safe.

## Next

[Module 3 — The topic–module–page model](03-topic-module-page-model.md)
