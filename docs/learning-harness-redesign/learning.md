---
title: "Learning design: Learning Harness Redesign"
slug: "learning-harness-redesign"
topicId: "learning-harness-redesign"
mode: "deep"
status: "validated"
pageCount: 6
objectiveCount: 5
---

# Learning design: Learning Harness Redesign

> The machine-readable learning contract for this topic. `deep-learn.mjs new`
> generates it; `deep-learn-visual.mjs validate` checks it. Edit the statements,
> keep the IDs stable.

The package ships eight research chapters under `modules/`. The page plan groups
them by the question a reader arrives with, not one page per chapter: six focused
pages instead of one oversized lesson.

## Objectives

| Objective ID | Statement |
| --- | --- |
| `learning-harness-redesign.explain-core` | Explain why the harness enforces a shape that fights the learner, and name the two root causes. |
| `learning-harness-redesign.trace-mechanism` | Trace a request from intent through routing, contracts, validators, and state transition. |
| `learning-harness-redesign.apply-practice` | Apply the topic/page/objective contract to a new topic and produce a legal multi-page structure. |
| `learning-harness-redesign.diagnose-failure` | Diagnose which gate catches a given failure and what that gate's error message must say. |
| `learning-harness-redesign.evaluate-tradeoffs` | Decide when to add a new harness artifact versus extending an existing one, and when to change the contract before changing the prompt. |

## Concepts

| Concept ID | Name | What the learner must be able to do with it |
| --- | --- | --- |
| `learning-harness-redesign.mental-model` | Accidental architecture | Explain how one strong exemplar becomes a platform constraint. |
| `learning-harness-redesign.ontology` | Content ontology | Separate domain, field, skill, topic, module, page, concept, lab, and assessment. |
| `learning-harness-redesign.cardinality` | Topic-module-page model | Decide when a topic needs child pages and when one page is right. |
| `learning-harness-redesign.lifecycle` | Learning lifecycle | Route an intent to a workflow and name that workflow's success measure. |
| `learning-harness-redesign.gates` | Quality gates | Match a failure to the gate that must catch it. |
| `learning-harness-redesign.orchestration` | Multi-agent orchestration | Assign write ownership and dependency order before parallel work. |
| `learning-harness-redesign.migration` | Migration mechanics | Sequence a contract change before migrating content. |

## Page plan

| Order | Kind | Page ID | Access level | Chapters | Objectives | Assessment |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | `overview` | `learning-harness-redesign` | quick-recall | README | explain-core | definition-check |
| 1 | `module` | `learning-harness-redesign-diagnosis` | visual-understanding | 01 | explain-core | diagnosis-check |
| 2 | `module` | `learning-harness-redesign-ontology` | visual-understanding | 02 | apply-practice | ontology-check |
| 3 | `module` | `learning-harness-redesign-page-model` | visual-understanding | 03 | apply-practice | page-model-check |
| 4 | `module` | `learning-harness-redesign-lifecycle` | visual-understanding | 04 | trace-mechanism | lifecycle-check |
| 5 | `deep-dive` | `learning-harness-redesign-gates` | complete-understanding | 05, 07, 08 | diagnose-failure, evaluate-tradeoffs | gates-check |
| 6 | `practice` | `learning-harness-redesign-practice` | active-recall | exercises.md | apply-practice, diagnose-failure | apply-check |
| 7 | `review` | `learning-harness-redesign-review` | active-recall | revision.md | diagnose-failure, evaluate-tradeoffs | consolidated-recall |

Planned pages: 8. `pagePlanning.maximumPageCount` is 12.

Chapter 06 (Astro learning experience) is intentionally not a page of its own: it
describes the presentation layer, which is now documented in `.agents/` and the
skill files rather than taught as a separate topic. Its coverage rows will record
that exclusion.

## Access levels

- `quick-recall` — the overview: definition, problem, mental model, three takeaways, use conditions
- `visual-understanding` — mechanism, flow, annotated example, relationships
- `complete-understanding` — implementation, internals, failures, production, sources
- `active-recall` — retrieval, prediction, debugging, transfer

## Rules this design must satisfy

- Every page declares at least one `objectiveIds` entry and one `assessmentIds` entry.
- Every objective has at least one assessment somewhere in the topic.
- The overview carries `level: quick-recall`; the practice and review pages carry `active-recall`.
- Page routes are stable. Renaming a page requires a migration note.
- Coverage rows in `.agents/coverage/learning-harness-redesign.md` map each research
  level-two heading to a destination anchor or a recorded exclusion reason.
- Do not add an objective here without adding the page and the assessment that teach it.

## Notes on this design

- The deep-dive page merges chapters 05, 07, and 08 because all three answer one
  reader question: *what stops this from breaking, and who decides when*. Three
  short pages would repeat the same framing.
- `orchestrate` is not a separate objective: multi-agent ownership is one of the
  gate decisions, and folding it into `diagnose-failure` keeps the objective set
  to things a learner can actually be assessed on.
- The research package remains the full record. These pages are the default path
  through it, not a replacement.

## Validation record

- Deterministic validation: `node .agents/bin/deep-learn.mjs validate learning-harness-redesign --strict`
- Semantic review: completed against the repository snapshot
- Objective/assessment coverage: enforced by `deep-learn-visual.mjs validate`