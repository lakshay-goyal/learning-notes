# Engineering knowledge base

This directory is the Markdown source of truth for DeepLearn research packages. Each topic has a stable slug, a navigable main lesson, a research plan, sources, implementation material, exercises, and revision material appropriate to its learning mode.

## Using this knowledge base

- Start a topic: `node scripts/deep-learn.mjs new "Topic name" --mode deep`
- Refresh the index: `node scripts/deep-learn.mjs index`
- Validate a draft: `node scripts/deep-learn.mjs validate <topic-slug>`
- Validate completed research: `node scripts/deep-learn.mjs validate <topic-slug> --strict`

Ask Codex to “Use DeepLearn to teach me …”, “go deeper into …”, or “review my understanding of …” to run the agent-driven workflow.

## Topics

<!-- DEEP_LEARN_INDEX_START -->

| Topic | Mode | Status | Updated |
| --- | --- | --- | --- |
| [Model Context Protocol](model-context-protocol/) | `deep` | `validated` | 2026-09-21 |

<!-- DEEP_LEARN_INDEX_END -->

## Status legend

- `draft`: scaffolded or incomplete
- `researched`: drafted but awaiting semantic validation
- `validated`: deterministic and semantic gates completed; limitations may still be documented
- `needs-refresh`: important time-sensitive material requires new verification
