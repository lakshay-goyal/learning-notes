---
name: structure-knowledge
description: Derive a topic-specific learning architecture, concept dependency order, objectives, and progressive-disclosure plan from an existing technical research package before authoring visual documentation.
---

# Structure Knowledge

Read every Markdown file in the research topic and any existing presentation. Extract definitions, mechanisms, APIs/configuration, examples, failures, production concerns, alternatives, repository findings, exercises, sources, limitations, open questions, and personal observations.

Build a concept dependency graph suited to the topic—not a fixed article outline. Decide what a learner must know first, what can be reconstructed visually, what belongs in the default scan path, and what belongs in deep disclosure or source pages.

Produce:

- practical learning objectives;
- prerequisites and stable concept identifiers;
- Quick Recall, Visual Understanding, Complete Understanding, and Active Recall destinations;
- a page/section hierarchy without empty sections;
- the initial `.agents/coverage/<slug>.md` mapping.

Read `.agents/rules/learning-experience.md` and `.agents/rules/content-coverage.md`. Preserve full access to research detail; compression applies to the default experience, not to knowledge availability.
