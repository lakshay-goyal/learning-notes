---
name: deep-learn-visual
description: Transform an existing DeepLearn research topic in docs/ into a structured, visual, source-traceable, retention-focused Astro/Starlight learning experience; use for publish, visualize, revise, connect, or incrementally update requests, not for doing the underlying research from scratch.
---

# DeepLearn Visual

Turn validated research into a layered learning experience while keeping `docs/` as the source of truth.

## Start

1. Read `.agent/config.json`, `.doty/config.json`, the complete `docs/<slug>/` package, any existing learning page, and `.agent/coverage/<slug>.md`.
2. Run `node scripts/deep-learn-visual.mjs inspect <slug>`.
3. Classify the request as publish, focused visualization, incremental update, revision, or audit. Read the matching file in `.agent/workflows/`.
4. If research is missing or insufficient for a consequential explanation, stop visual authorship for that claim and route research work through the existing `deep-learn` workflow. Do not fill the gap by inference presented as fact.

## Orchestrate

- Use `structure-knowledge` to derive learning objectives, prerequisite order, concepts, mechanisms, and the four access levels.
- Use `visualize-concept` only where a visual answers a concrete question.
- Use `generate-learning-page` to author or incrementally update the MDX presentation with reusable components.
- Use `generate-recall` for answer-hidden, concept-linked retrieval practice.
- Use `connect-knowledge` for stable, meaningful relationships to existing routes.
- Maintain the topic coverage map using `.agent/rules/content-coverage.md`.

Prefer Markdown for ordinary prose and MDX only where learning components add value. Reuse `src/components/learning/`, Starlight components, Expressive Code, Mermaid, D2, quiz, and site graph before adding a dependency. Keep browser interaction narrowly hydrated with Astro component scripts.

## Preserve the two-layer contract

- Research source: `docs/<slug>/**/*.md`.
- Presentation: `src/content/docs/**/*.mdx` with `learning.researchSlug: <slug>`.
- Direct source access: `/research/<slug>/...`, rendered from the research collection.
- Transformation audit: `.agent/coverage/<slug>.md`.
- Learner progress: browser-local state, separate from both content layers.

Never overwrite or compress the research package to simplify the presentation.

## Finish

1. Run `node scripts/deep-learn.mjs validate <slug> --strict`.
2. Run `node scripts/deep-learn-visual.mjs validate <slug> --strict`.
3. Run the relevant tests and `npm run build`.
4. Apply `.agent/evals/visual-quality.md` and `.agent/evals/acceptance-tests.md` to the rendered page in desktop/mobile and light/dark modes when browser inspection is available.
5. Report what is implemented, source coverage, validation results, visualization choices, update path, progress-storage limits, and any unverified capability.

A successful build is necessary but does not certify technical or educational quality.
