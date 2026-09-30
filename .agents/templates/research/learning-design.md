---
title: "Learning design: {{TOPIC}}"
slug: "{{SLUG}}"
topicId: "{{TOPIC_ID}}"
mode: "{{MODE}}"
status: "draft"
pageCount: {{PAGE_COUNT}}
objectiveCount: {{OBJECTIVE_COUNT}}
---

# Learning design: {{TOPIC}}

> The machine-readable learning contract for this topic. `deep-learn.mjs new`
> generates it; `deep-learn-visual.mjs validate` checks it. Edit the statements,
> keep the IDs stable.

## Objectives

Observable outcomes. Every objective must be assessable by something other than
recognition. IDs are `<topicId>.<name>` and are referenced by
`learning.objectiveIds` on every published page.

| Objective ID | Statement |
| --- | --- |
| `{{TOPIC_ID}}.explain-core` | Explain what {{TOPIC}} is, the problem it solves, and its mental model. |
| `{{TOPIC_ID}}.trace-mechanism` | Trace the core mechanism step by step, including data and control flow. |
| `{{TOPIC_ID}}.apply-practice` | Build or configure a small working example. |
| `{{TOPIC_ID}}.diagnose-failure` | Diagnose a realistic failure or misuse. |
| `{{TOPIC_ID}}.evaluate-tradeoffs` | Evaluate against alternatives and state when not to use it. |

## Concepts

| Concept ID | Name | What the learner must be able to do with it |
| --- | --- | --- |
| `{{TOPIC_ID}}.mental-model` | Mental model | Predict behaviour from the smallest accurate picture. |
| `{{TOPIC_ID}}.core-mechanism` | Core mechanism | Trace the concrete flow that produces the behaviour. |
| `{{TOPIC_ID}}.failure-model` | Failure model | Say what breaks, where it surfaces, and why. |
| `{{TOPIC_ID}}.tradeoffs` | Trade-offs | Weigh cost, limits, and the decision boundary. |

## Page plan

One overview plus focused child pages, split by learning job rather than by
section length.

{{PAGE_TABLE}}

## Access levels

Every topic supports all four levels, proportionate to the subject:

- `quick-recall` — the overview: definition, problem, mental model, three takeaways, use conditions
- `visual-understanding` — mechanism, flow, annotated example, relationships
- `complete-understanding` — implementation, internals, failures, production, sources
- `active-recall` — retrieval, prediction, debugging, transfer

## Rules this design must satisfy

- Every page declares at least one `objectiveIds` entry and one `assessmentIds` entry.
- Every objective has at least one assessment somewhere in the topic.
- The overview carries `level: quick-recall`; at least one page carries `active-recall`.
- Page routes are stable. Renaming a page requires a migration note.
- Coverage rows in `.agents/coverage/<slug>.md` map each research level-two
  heading to a destination anchor or a recorded exclusion reason.
- Do not add an objective here without adding the page and the assessment that teach it.

## Validation record

- Deterministic validation: NOT RUN
- Semantic review: NOT RUN
- Objective/assessment coverage: NOT RUN