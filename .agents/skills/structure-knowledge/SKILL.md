---
name: structure-knowledge
description: "Derive objectives, concepts, prerequisites, and a page plan from research."
invocation: model
---

# Structure Knowledge

Derive the learning architecture for a topic before any prose is written. This
stage produces or corrects `docs/<slug>/learning.md`, which the visual stage
plans against.

## Read

Every Markdown file in the research package, plus any existing presentation and
coverage map. If a `learning.md` already exists, read it first and amend it: keep
the stable IDs, change the statements only when the material demands it.

## Extract

From the research, not from the topic name:

- definitions and the problem the concept solves
- mechanisms, control flow, and data flow
- APIs, configuration, and data structures
- failure modes and where they surface
- production concerns that materially apply
- alternatives and the decision boundary between them
- repository findings, exercises, sources, limitations, and open questions

## Decide

- What must the learner know first? Build the dependency order, not an outline.
- Which parts are reconstructible from a diagram and which need prose?
- What belongs on the default scan path versus behind a deep dive?
- Which objectives can be assessed by doing something rather than recognising?

## Produce

`docs/<slug>/learning.md` with:

- **Objectives** — observable outcomes, `<topicId>.<name>` IDs, each assessable
  by something other than recognition.
- **Concepts** — named ideas with stable IDs, independent of the page that teaches them.
- **Page plan** — one overview plus focused children, with the objectives and
  assessment each page owns. This is the plan the validator checks, so it must
  match what is actually published.
- **Access levels** — how quick recall, visual understanding, complete
  understanding, and active recall are distributed across the pages.

## Rules

- Read `.agents/rules/learning-experience.md` and `.agents/rules/content-coverage.md`.
- Preserve full access to research detail. Compression applies to the default
  experience, not to knowledge availability.
- Do not add an objective without naming the page and the assessment that teach it.
- Never use exclusion to hide a gap you did not close.

## Done when

`learning.md` exists, every objective has an assessment, the page plan covers the
four access levels, and no page in the plan is empty.