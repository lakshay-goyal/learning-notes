# Module 1 — Why the current harness fights the learner

## Learning objective

After this module, you should be able to explain the difference between the repository’s intended learning architecture and the architecture its code currently enforces.

## The 60-second mental model

Think of the repository as three layers that were designed separately:

```text
Methodology     → what an agent should ideally do
CLI contracts    → what the agent is allowed to produce
Astro app        → what the learner is eventually shown
```

When those three disagree, the CLI usually wins because it can reject a file, while prose can only advise the model.

## The two root causes

### Root cause 1: research is organized by artifact type

The research scaffolder creates the same flat sibling files for every topic:

- `README.md`
- `research-plan.md`
- `implementation.md`
- `exercises.md`
- `revision.md`
- `sources.md`
- optional `repositories.md`

That is convenient for validators, but it is not a learner journey. The learner has to move across several document types to understand one mechanism.

A learner-centered package would instead begin with objectives and concepts, then organize modules around dependency and practice. Research plans, source ledgers, and revision records should support those modules rather than become the learner’s navigation.

### Root cause 2: visual cardinality is hardcoded

The current visual validator requires exactly one learning page for a research slug. The MCP topic therefore becomes one 3,789-word page containing:

- orientation;
- foundations;
- protocol mechanism;
- code;
- security;
- production engineering;
- source internals;
- alternatives;
- recall;
- practice;
- references.

The methodology talks about four access levels and a page/section hierarchy, but the code accepts only one page. This is why the harness feels heavy: it has route-level progressive disclosure in the design, but section-level disclosure in the implementation.

## The evidence

| Observed behavior | Enforcement point | Consequence |
| --- | --- | --- |
| Same files for every mode | `scripts/deep-learn.mjs` scaffolder | `quick` and `deep` are nearly identical in shape |
| One visual page | `scripts/deep-learn-visual.mjs:226-229` | child pages fail validation |
| Topic ID equals page ID | `src/content.config.ts:8-35` | pages cannot share a topic identity |
| One hardcoded research backlink | `src/pages/research/[...slug].astro:26-28` | future topics do not get a visual link |
| H2-to-anchor coverage | `.agent/coverage/` and visual validator | reachability is mistaken for teaching |
| Dashboard entry equals topic | `LearningDashboard.astro:4-15` | splitting pages would create duplicate topic cards |
| Manual status strings | research README frontmatter | semantic review is not machine-derived |

## Why this happened

The repository began with one carefully researched topic: MCP. The team built a strong method around that exemplar, then encoded the exemplar’s shape into the contract.

That is a common `n = 1` failure:

1. one high-quality example;
2. one successful page;
3. one validator written to reproduce that success;
4. every future topic forced into the same shape.

The content is not the problem. The MCP page is thoughtful and source-aware. The problem is that its accidental shape became the platform.

## What is actually a good decision here

Do not throw away the whole harness.

Keep:

- source-backed research;
- explicit version boundaries;
- a research archive separate from visual presentation;
- preservation of existing work;
- deterministic checks before semantic claims;
- honest uncertainty labels;
- local-first progress privacy.

The redesign should preserve the evidence discipline while removing the one-page and flat-package assumptions.

## Interactive diagnosis

Ask these questions before changing a prompt:

1. Which file or schema forces the shape?
2. Which validator rejects the alternative?
3. Which component assumes that shape at runtime?
4. Which documentation claims an enforcement that code does not provide?
5. Can a small fixture prove the desired alternative before content migration?

<details>
<summary>Why this order matters</summary>

If the model receives a better decomposition prompt while the validator still rejects multiple pages, the model will either ignore the prompt or compress its work. Fix the machine contract first; then improve the prompt.

</details>

## Checkpoint

<details>
<summary>Which sentence best describes the current system?</summary>

**Answer:** It is a sophisticated content compiler with a strong research layer, but its current topic model is one page per research slug.

That is different from saying the repository is bad. It identifies the smallest architectural change that unlocks the rest of the design.

</details>

## Takeaways

- Methodology and code are separate contracts; inspect both.
- Flat research files and one-page publishing are mechanical decisions, not inevitable UX.
- A strong exemplar can become a harmful default when copied into validation.
- Preserve evidence quality; change representation and cardinality.

## Next

[Module 2 — Content ontology](02-content-ontology.md)
