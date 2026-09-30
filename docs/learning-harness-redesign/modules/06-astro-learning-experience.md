# Module 6 — Astro learning experience: routing, interaction, accessibility, and progress

## Learning objective

After this module, you should be able to design the published experience so that multiple pages remain navigable, source-traceable, accessible, and honest about learner state.

## The app is not the main limitation

Astro and Starlight already support nested Markdown/MDX routes, content collections, generated static paths, redirects, and navigation. The one-page behavior comes from the harness contract, not from Astro.

The redesign should preserve the current architecture:

```text
docs/                  research source
src/content/docs/      visual learning presentation
src/pages/research/    source archive routes
.agents/coverage/       transformation audit
browser storage        local learner state
```

The missing piece is a first-class topic/page model between them.

## Route design

A topic should have:

- a stable canonical overview;
- child module routes;
- a practice route;
- a review route;
- a research archive route;
- aliases for old routes.

Example:

```text
/ai-engineering/agent-integration/model-context-protocol/
/ai-engineering/agent-integration/model-context-protocol/tool-call/
/ai-engineering/agent-integration/model-context-protocol/production/
/ai-engineering/agent-integration/model-context-protocol/practice/
/ai-engineering/agent-integration/model-context-protocol/review/
/research/model-context-protocol/
```

Astro’s rest parameters and generated routes are well suited to this shape. The custom research route should resolve the visual overview from a manifest or content collection, not from a hardcoded topic check.

## Navigation requirements

Every topic overview should show:

- what the topic is;
- who it is for;
- prerequisite topics;
- module order;
- estimated time;
- current progress;
- next recommended action;
- source/version boundary.

Every child page should show:

- breadcrumb;
- previous/next links;
- objective being taught;
- research source;
- local recall action;
- next step.

## Progressive disclosure

Use disclosure for secondary detail, not for the entire lesson.

Good uses:

- “Show implementation details”
- “Show source paths”
- “Show common failure”
- “Show advanced trade-offs”

Bad use:

- hiding every meaningful learning objective behind a toggle.

The default path should let a learner understand what the topic is and decide where to go. The complete path should remain available without being visually overwhelming.

## Accessibility contract

Interactive components must provide:

- native buttons or links;
- keyboard operation;
- visible focus;
- selected/current state;
- text equivalents for diagrams and charts;
- useful heading structure;
- reduced-motion behavior;
- no page-level horizontal overflow;
- no broken static fallback.

The current newer learning components are closer to this goal. Older visual-demo components need an accessibility pass before they are treated as reusable production patterns.

## Diagram selection

Use a representation because it answers a question:

| Question | Useful representation |
| --- | --- |
| What talks to what? | component diagram |
| What happens first? | sequence/timeline |
| How does state change? | state diagram |
| What differs exactly? | comparison table |
| What should I choose? | decision tree |
| Why does code behave this way? | annotated execution trace |

A diagram is successful when the learner can explain the relationship without reading a long caption.

## Progress model

Separate content completion from evidence of competence.

### Topic state

```text
not started
learning
practiced
assessed
mastered
needs refresh
```

### Objective state

Each objective should record:

- attempts;
- confidence;
- question IDs;
- lab IDs;
- last review;
- next review;
- evidence status.

### Storage rules

- centralize storage logic;
- version the schema;
- migrate old data;
- handle unavailable/full storage;
- export and import;
- never claim synchronization without a sync service;
- keep progress separate from research and presentation source files.

## Dashboard design

The dashboard should aggregate topic manifests, not count child pages.

Useful metrics:

- topics in progress;
- next recommended topic;
- objectives needing practice;
- labs completed;
- reviews due;
- stale topics;
- evidence coverage.

A topic is not “mastered” because a user clicked a button.

## Research route integration

Custom research routes need explicit treatment for:

- backlink generation;
- link validation;
- view modes;
- site graph inclusion;
- raw Markdown output;
- LLM text output;
- search indexing;
- publication filtering.

Do not make a plugin silently assume every page belongs to the main docs collection.

## Interactive design review

Take one existing page and annotate it:

1. mark the default scan path;
2. mark secondary detail;
3. identify every independent objective;
4. identify every missing keyboard or text equivalent;
5. identify the progress action;
6. identify the next step;
7. decide what belongs on a child page.

<details>
<summary>What should a dashboard count?</summary>

It should count canonical topics and objective evidence. A topic with six child pages should still count as one topic, while the six pages should contribute to objective and practice coverage.

</details>

## Takeaways

- Astro can support the target route structure.
- Research and presentation need manifest-driven backlinks.
- Disclosure reduces noise but cannot hide the learning model.
- Accessibility is part of the content contract.
- Progress should measure evidence, not clicks.
- Plugin integrations need explicit route-aware tests.

## Next

[Module 7 — Multi-agent orchestration](07-multi-agent-orchestration.md)
