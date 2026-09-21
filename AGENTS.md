## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## DeepLearn research harness

- Treat the Astro application (`src/`, `public/`, Astro configuration, and application dependencies) as read-only during learning and research tasks unless the user separately asks to change it.
- For requests to research, teach, extend, update, or review a technical topic, use the repository-local `deep-learn` skill in `.agents/skills/deep-learn/`.
- Keep all generated learning content in `docs/` as Markdown. Do not place generated lessons in `src/content/docs/` and do not create HTML, PDF, DOCX, JSON reports, or standalone diagram files, except for `docs/<slug>/review/insight.html` produced by the `review-learning` skill.
- Read `.doty/config.json` and the mode-specific methodology referenced by the skill before starting a learning workflow.
- Use `node scripts/deep-learn.mjs` for topic scaffolding, knowledge-index updates, and deterministic validation. Semantic and factual validation still require agent review.
- Preserve existing topic material when extending it. Research only missing or stale areas unless the user requests a complete refresh, and record meaningful changes in the topic README.

## Review Learning harness

- For requests to review learning, check progress, audit knowledge, or find missing subtopics around a skill (including `/review-learning`), use the repository-local `review-learning` skill in `.agents/skills/review-learning/`.
- Read `.agent/skills/review-learning/SKILL.md` completely before starting. It owns the methodology; the adapter holds no separate rules.
- Treat the Astro application (`src/`, `public/`, Astro configuration, and application dependencies) as read-only. The only writable location is `docs/<slug>/review/` with `review.md` (durable record) plus `insight.html` (self-contained visual, no external requests).
- Read the full local package first (`README.md`, `implementation.md`, `exercises.md`, `revision.md`, `sources.md`, `repositories.md` when present), search all of `docs/` and related learning pages for adjacent notes, and inspect assignment/project evidence documented inside the notes. Inspect a linked GitHub repo, blog, or paper only when the notes reference it and it is reachable; otherwise record the limitation.
- Compare local coverage against the official docs for the package's recorded version, rate each item as covered, partial, missing, or stale, order gaps by learning impact, and recommend open-source repos plus applications and services that close the gaps or make the work easier (each pick mapped to the gap it addresses).
- Run `node scripts/deep-learn.mjs validate <slug>` before reporting. The validator permits `docs/<slug>/review/*.html`; every other non-Markdown file under `docs/` still fails.

## DeepLearn Visual harness

- For requests to publish, visualize, revise, connect, or update completed DeepLearn research in the Astro application, use the repository-local `deep-learn-visual` skill in `.agents/skills/deep-learn-visual/`.
- Treat `docs/` as the research source of truth. Learning pages in `src/content/docs/` are a maintained presentation layer and must link to the corresponding `/research/` routes.
- Read `.agent/config.json` and the canonical skill/rules referenced by the adapter before changing visual learning content.
- Use `node scripts/deep-learn-visual.mjs inspect <slug>` before transforming a topic and `node scripts/deep-learn-visual.mjs validate <slug> --strict` before claiming it is complete.
- Preserve stable topic IDs and routes during incremental updates. Update `.agent/coverage/<slug>.md` whenever source or destination sections change.
- Keep progress data separate from research. The current local-only revision MVP stores learner state in browser `localStorage`; do not describe it as cross-device sync.
