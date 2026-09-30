# Exercises and workshop: Learning Harness Redesign

## How to use this workshop

Do not read every exercise linearly. Choose the activity that matches the change you want to make, write an answer before opening the hint, and compare your reasoning with the acceptance criteria.

## Concept and debugging checks

1. Explain why a fixed six-file research package and a one-page visual contract produce different failure modes.
2. A topic has 12 objectives and four independent labs. Should it remain one page? Defend the answer using cognitive load, dependency, and assessment—not file count alone.
3. Explain the difference between “the research heading is reachable” and “the learner can perform the objective.”
4. Why can a valid YAML frontmatter file still fail in Astro?
5. What breaks when a route is derived from a taxonomy that changes every year?
6. Why should a verifier agent not be the same agent that authored a module?

## Interactive diagnosis: find the accidental architecture

For each prompt, write the **mechanical enforcement point**, not only the policy statement.

| Prompt | Your answer |
| --- | --- |
| Why is every research topic flat? | |
| Why is every visual topic one page? | |
| Why can the dashboard count pages instead of topics after a split? | |
| Why can a relative learning-page link be broken without a build failure? | |
| Why can a review report make later visual validation fail? | |
| Why does changing the storage key in config do nothing? | |

<details>
<summary>Hint: search code before reading policy</summary>

Inspect the scaffolder’s file table, visual page-cardinality check, learning schema, link-validation exclusions, recursive Markdown walk, and component-level storage literals.

</details>

## Redesign workshop

### Scenario

You are redesigning the Model Context Protocol learning experience. The current package contains:

- protocol history and specification;
- host/client/server roles;
- tools, resources, and prompts;
- stdio and Streamable HTTP;
- protocol-era differences;
- TypeScript SDK source paths;
- authorization and production security;
- reliability and idempotency;
- three project levels;
- six review questions.

The current published page is 3,789 words and passes the existing visual validator.

### Task 1 — Define outcomes

Write five observable objectives using only these verbs:

- explain
- trace
- compare
- implement
- design
- debug
- evaluate

```text
Objective 1:
Observable evidence:
Prerequisite concepts:

Objective 2:
Observable evidence:
Prerequisite concepts:
```

### Task 2 — Build the concept graph

Use stable IDs and show dependencies.

```text
mcp.host-client-server
  ├── mcp.client-connection
  ├── mcp.server-registration
  └── mcp.tool-capability
```

For each concept, record:

- mechanism;
- common misconception;
- failure mode;
- evidence source;
- likely assessment.

### Task 3 — Cluster into modules

Apply these split signals:

- independent objective;
- independent assessment;
- distinct prerequisite edge;
- separate search intent;
- different visual explanation;
- more than one substantial worked example;
- source study that distracts from the learner’s main model.

Apply these merge signals:

- inseparable mental model;
- no independent outcome;
- splitting repeats prerequisites;
- example and failure case cannot stand apart from the concept.

### Task 4 — Produce a page plan

| Order | Page ID | Dominant objective | Module | Visual | Practice/assessment |
| ---: | --- | --- | --- | --- | --- |
| 0 | `overview` | Choose the next step | — | learning map | path self-check |
| 1 |  |  |  |  |  |
| 2 |  |  |  |  |  |

### Task 5 — Define compatibility

Specify:

- the existing URL that must remain;
- important anchors that must resolve or redirect;
- progress IDs that must migrate;
- research routes that must remain unchanged;
- dashboard behavior after pages are split;
- how the site avoids counting child pages as separate topics.

## Architecture decision records

Write short decision records for the following choices.

### ADR-001: Separate topic and page identity

**Context:**  
**Decision:**  
**Alternatives rejected:**  
**Consequences:**  
**Rollback plan:**

### ADR-002: Keep research and presentation separate

**Context:**  
**Decision:**  
**Alternatives rejected:**  
**Consequences:**  
**What would invalidate this decision?**

### ADR-003: Keep progress local for the next phase

**Context:**  
**Decision:**  
**Alternatives rejected:**  
**Consequences:**  
**Required future work:**

## Prompt-routing simulation

For each user request, choose exactly one intent and state whether files may be written.

| User request | Intent | Write policy | Route |
| --- | --- | --- | --- |
| “Explain HTTP/2 flow control.” |  |  |  |
| “Research HTTP/2 and save complete notes.” |  |  |  |
| “Update my HTTP/2 notes for the latest RFC.” |  |  |  |
| “Turn the HTTP/2 research into visual lessons.” |  |  |  |
| “Quiz me on flow-control windows.” |  |  |  |
| “Audit whether my HTTP/2 notes are stale.” |  |  |  |
| “Build a lab that reproduces a flow-control bug.” |  |  |  |

<details>
<summary>Suggested router</summary>

Use `explain`, `research`, `update`, `publish`, `review`, `maintain`, and `practice` as distinct intents. `explain` defaults to no writes. A review never creates a new research package merely because the topic is missing; it reports the missing prerequisite or offers research as a separate next action.

</details>

## Validation design challenge

Design fixtures for these cases:

1. A topic with one overview and three child pages.
2. Two child pages with the same `pageId`.
3. Two pages targeting the same route.
4. A learning page pointing to a missing research topic.
5. A research page with no visual backlink.
6. A relative Markdown link to a missing child page.
7. A topic manifest with a prerequisite cycle.
8. An objective with no page or assessment.
9. A page marked published while its topic is draft.
10. A review artifact adding headings that should not affect publication coverage.
11. A config key that no code consumes.
12. A stored progress document from schema v1.

For each fixture, write the expected exit code and error category.

## Migration drill: split MCP without breaking it

### Constraints

- preserve `/ai-engineering/model-context-protocol/`;
- preserve `/research/model-context-protocol/` and child research routes;
- preserve or redirect important existing anchors;
- keep `topicId = model-context-protocol`;
- add unique page IDs;
- do not duplicate the same prose across pages;
- keep full research reachable;
- move recall near the relevant module and retain a final review page.

### Deliverable

Produce:

1. current-to-new page mapping;
2. stable anchor migration table;
3. progress migration table;
4. validation fixtures;
5. rollback procedure.

<details>
<summary>Example page mapping</summary>

A valid mapping could keep overview at the existing route; add `foundations`, `tool-call`, `production`, `source-map`, `practice`, and `review`; move implementation detail into `tool-call`; move security and reliability into `production`; and leave exhaustive source records linked from `source-map` and `/research/`.

</details>

## Codebase-reading exercise

Trace one request through the current repository:

```text
user asks to publish a second research topic
    ↓
which skill is selected?
    ↓
which files may be written?
    ↓
which validator discovers the topic?
    ↓
how is the research backlink produced?
    ↓
how does the dashboard learn about the topic?
    ↓
where can the request fail without being detected?
```

Record exact file paths and line numbers for every arrow.

## Transfer challenge: design a harness for a different domain

Redesign the same architecture for a personal curriculum in distributed systems.

### Required outputs

- domain and field registry;
- five skill definitions;
- one prerequisite graph;
- one topic with two modules and three pages;
- one lab;
- one transfer assessment;
- one freshness rule;
- one learner-progress record.

Explain which parts of the harness are domain-neutral and which parts should remain specific to software and AI engineering.

## Self-assessment

- [ ] I can explain the current one-page invariant without reading the source.
- [ ] I can design a topic manifest with separate topic and page IDs.
- [ ] I can distinguish module, page, lab, and assessment.
- [ ] I can route explain and research requests differently.
- [ ] I can design cross-layer orphan detection.
- [ ] I can plan a route-compatible MCP migration.
- [ ] I can identify when semantic review still requires a human or independent agent.
- [ ] I know which current harness ideas should be preserved.
