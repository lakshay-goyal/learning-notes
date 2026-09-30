---
name: migrate-content
description: "Split a topic into one overview plus focused child pages, preserving routes."
invocation: user
---

# Migrate Content

Turn one oversized learning page into one overview plus focused child pages,
without losing content, breaking a route, or inventing a claim.

This is the operation that produces the multi-page structure. The reason it needs
a skill is that a split is lossy in three specific ways, and each has to be
checked explicitly: text with no new home, routes that move, and coverage rows
that point at anchors which no longer exist.

## Read first

1. `docs/<slug>/learning.md` — the objectives, concepts, and planned page set.
2. `node .agents/bin/deep-learn-visual.mjs inspect <slug>` — current pages.
3. Every published page for the topic, plus `.agents/coverage/<slug>.md`.

## Choose the split by learning job

Not by length. Each child page answers one question the overview cannot:

| Page kind | Answers |
| --- | --- |
| `overview` | What is this, why does it matter, when should I use it? |
| `module` | How does mechanism X work, step by step? |
| `deep-dive` | What is the internals, source layout, or edge case detail? |
| `practice` | How do I build or configure it? |
| `review` | Can I retrieve and apply this without looking? |

Target the count in `learning.md`'s page plan. Respect `pagePlanning.minimumPageCount`
and `maximumPageCount` from `.agents/config.json`.

## Move, do not rewrite

- Cut prose from the overview into the child page that owns it. Keep sentences intact.
- The overview keeps: quick recall, the mental model, the core visual, three takeaways, use conditions, and one next step.
- Every child page ends with a link to `/research/<slug>/` and to the overview.
- Do not invent new technical claims during a split. If a section needs a claim you do not have, mark it for research instead.

## Preserve routes

- The overview keeps its current file path and therefore its route.
- New child pages get new paths. Nothing that already resolves may move without a redirect.
- `pageId` is unique and stable. `topicId` is shared by every page of the topic.
- If a section must move out of the overview, add a short pointer where it used to be, so an existing reader does not hit a dead end.

## Update coverage deliberately

Every level-two research heading needs a row in `.agents/coverage/<slug>.md`:

| Source file | Source section | Destination file | Destination anchor | Status | Transformation |
| --- | --- | --- | --- | --- | --- |

- `MAPPED` requires a destination file and an anchor that the built page actually has. Anchors are slugged by the build, so copy the heading text and let `validate` confirm.
- `INTENTIONALLY_EXCLUDED` requires a note matching `outside`, `duplicate`, `workflow`, `metadata`, `scope`, or `not applicable`. Never use exclusion to hide a gap you did not close.

## Declare the contract

Every page carries:

- `id`, `topicId`, `pageId`, `kind`, `order`, `category`, `difficulty`, `researchSlug`, `updated`
- `level` — `quick-recall` on the overview, `active-recall` on review or practice pages
- at least one `objectiveIds` entry and one `assessmentIds` entry
- taxonomy IDs that exist in `.agents/registry/taxonomy.json`

## Finish

Run in order. Do not continue past a failure.

```bash
node .agents/bin/deep-learn-visual.mjs inspect <slug>
node .agents/bin/harness.mjs check --layer=static
node .agents/bin/harness.mjs check --layer=runtime
node .agents/bin/harness.mjs receipt <slug>
```

## Report

Page count before and after. What moved. What stayed. Objective coverage
(`covered/total` from the validator). Any content that had no home. Any route
that changed.

## Done when

One overview plus the planned child pages exist, `harness.mjs check --layer=static`
passes, a receipt exists, and no coverage row points at a missing anchor.