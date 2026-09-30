---
name: deep-learn-visual
description: "Publish existing DeepLearn research as multi-page visual Astro learning pages."
invocation: model
---

# DeepLearn Visual

Turn validated research into a layered, multi-page learning experience while
keeping `docs/` as the source of truth.

## Start

1. Read `.agents/config.json`, `docs/<slug>/learning.md`, and the existing pages
   and coverage map. Read the rest of `docs/<slug>/` as the relevant sections
   become necessary, not the whole package up front.
2. Run `node .agents/bin/deep-learn-visual.mjs inspect <slug>`. It reports the
   objectives, the planned page count, the published pages, and objective coverage.
3. Classify the request as first publish, incremental update, revision, or audit,
   and read the matching file in `.agents/workflows/visual/`.
4. If research is missing for a consequential explanation, stop authoring that
   claim and route it through `deep-learn`. Do not fill a gap with inference
   presented as fact.

## Plan the page set from the learning design

`docs/<slug>/learning.md` is the contract. It declares the objectives, the
concepts, and the planned pages. Read the page plan and follow it.

- One `overview` plus focused `module`, `deep-dive`, `practice`, and `review` pages.
- Split by learning job, not by section length. A page exists to carry one
  objective's worth of cognitive load.
- If the design's plan is wrong for the material, change the design first, then
  the pages. A page set that contradicts the design fails objective coverage.
- Respect `pagePlanning.minimumPageCount` and `maximumPageCount` from config.
- Never compress the research package to fit a page. Full detail stays at
  `/research/<slug>/`.

## Orchestrate

- `structure-knowledge` — objectives, prerequisite order, concepts, access levels
- `visualize-concept` — only where a visual answers a concrete question
- `generate-learning-page` — author or update one page with reusable components
- `generate-recall` — answer-hidden, objective-linked retrieval practice
- `connect-knowledge` — stable-ID relationships where the route exists
- `migrate-content` — when splitting an existing single page
- `validate-learning-docs` — the ordered gate plus the quality rubrics

Prefer Markdown for ordinary prose and MDX only where learning components add
value. Reuse `src/components/learning/`, Starlight, Expressive Code, Mermaid, D2,
and the quiz plugin before adding a dependency. Keep browser interaction narrowly
hydrated.

## Preserve the three layers

| Layer | Where |
| --- | --- |
| Research source | `docs/<slug>/**/*.md`, except `review/` |
| Presentation | `src/content/docs/**/*.mdx` with `learning.researchSlug: <slug>` |
| Direct source access | `/research/<slug>/...` |
| Transformation audit | `.agents/coverage/<slug>.md` |
| Learner progress | browser-local state, separate from both content layers |

Research status, publication state, and learner progress are three different
things. See `.agents/GLOSSARY.md`.

## Every page declares its job

```yaml
learning:
  id: <unique pageId>
  topicId: <shared topic id>
  pageId: <unique pageId>
  kind: overview | module | deep-dive | practice | review
  order: <unique within the topic>
  level: quick-recall | visual-understanding | complete-understanding | active-recall
  category: <category>
  difficulty: beginner | intermediate | advanced
  researchSlug: <slug>
  updated: <YYYY-MM-DD>
  objectiveIds: [<topicId>.<objective>]      # at least one
  assessmentIds: [<topicId>.<check>]        # at least one
  conceptIds: []
  domainIds: []        # must exist in .agents/registry/taxonomy.json
  fieldIds: []
  skillIds: []
  toolIds: []
```

The validator rejects a page with no objective, no assessment, an objective the
design does not declare, an unknown taxonomy ID, a duplicate `pageId`, or a
duplicate route.

## Cover every research section

`.agents/coverage/<slug>.md` needs one row per research level-two heading:

| Source file | Source section | Destination file | Destination anchor | Status | Transformation |
| --- | --- | --- | --- | --- | --- |

`MAPPED` needs a destination file and an anchor the built page really has.
`INTENTIONALLY_EXCLUDED` needs a note containing `outside`, `duplicate`,
`workflow`, `metadata`, `scope`, or `not applicable`. Never exclude to hide a gap.

## Finish

Run the gate in order. Do not continue past a failing layer.

```bash
node .agents/bin/harness.mjs check --layer=static
node .agents/bin/harness.mjs check --layer=runtime
node .agents/bin/harness.mjs receipt <slug>
```

Then apply `.agents/evals/visual-quality.md` and `.agents/evals/acceptance-tests.md`
to the rendered pages in desktop and mobile widths and light and dark themes when
browser inspection is available.

Report what was implemented, the objective coverage ratio, the source coverage,
visualization choices with the question each answers, the update path,
progress-storage limits, and anything unverified.

A passing build proves structure. It does not certify technical or educational
quality.