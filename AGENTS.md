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
- Keep all generated learning content in `docs/` as Markdown. Do not place generated lessons in `src/content/docs/` and do not create HTML, PDF, DOCX, JSON reports, or standalone diagram files.
- Read `.doty/config.json` and the mode-specific methodology referenced by the skill before starting a learning workflow.
- Use `node scripts/deep-learn.mjs` for topic scaffolding, knowledge-index updates, and deterministic validation. Semantic and factual validation still require agent review.
- Preserve existing topic material when extending it. Research only missing or stale areas unless the user requests a complete refresh, and record meaningful changes in the topic README.
