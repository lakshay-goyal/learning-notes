# Engineering knowledge base

The Markdown source of truth for DeepLearn research packages. Each topic has a
stable slug, a main lesson, a research plan, a source ledger, a learning design,
and implementation, exercise, and revision material appropriate to its mode.

## Using this knowledge base

```bash
node .agents/bin/deep-learn.mjs new "Topic name" --mode deep
node .agents/bin/deep-learn.mjs index
node .agents/bin/deep-learn.mjs validate <topic-slug>            # a draft
node .agents/bin/deep-learn.mjs validate <topic-slug> --strict   # validated research
node .agents/bin/deep-learn.mjs doctor
```

`new` writes the research package and `docs/<slug>/learning.md` together. The
learning design holds the objectives, concepts, and multi-page plan the visual
stage works from.

Ask the agent to "teach me …", "go deeper into …", or "review my understanding
of …". To publish validated research as a visual lesson, ask it to "publish my
… research".

## Package contents

| File | Holds |
| --- | --- |
| `README.md` | main lesson and navigation |
| `learning.md` | objectives, concepts, page plan, assessments |
| `research-plan.md` | scope, questions, evidence plan, stop conditions |
| `implementation.md` | examples and the execution record |
| `exercises.md` | active-learning prompts |
| `revision.md` | retrieval prompts and self-assessment |
| `sources.md` | source ledger with versions and inspection status |
| `repositories.md` | inspected source, only when relevant |
| `review/` | review output, excluded from coverage validation |

## Topics

> **Interactive guide:** [Learning Harness Redesign](learning-harness-redesign/) is a
> chapter-based path through the architecture audit. Read the overview first; do not
> consume every chapter linearly.

<!-- DEEP_LEARN_INDEX_START -->

| Topic | Mode | Status | Updated |
| --- | --- | --- | --- |
| [Learning Harness Redesign](learning-harness-redesign/) | `deep` | `validated` | 2026-09-28 |

<!-- DEEP_LEARN_INDEX_END -->

## Status legend

| Status | Meaning |
| --- | --- |
| `draft` | scaffolded or materially incomplete |
| `researched` | evidence gathered and lesson written; semantic review pending |
| `validated` | deterministic and semantic gates completed; limitations may still be documented |
| `needs-refresh` | important time-sensitive material requires re-verification |

`validated` means both gates passed. It never means every fact is guaranteed.
Limitations and unresolved questions stay visible in the package.