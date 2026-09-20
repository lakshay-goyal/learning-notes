# DeepLearn Visual methodology

`.agent/` is the canonical, tool-neutral methodology for turning validated DeepLearn research into the Astro learning experience. It complements—rather than replaces—the research harness in `.doty/`.

## Boundaries

- `docs/` remains the source of truth for research, sources, code studies, exercises, and personal findings.
- `src/content/docs/` contains the structured learning presentation.
- Astro loads `docs/**/*.md` into the read-only `research` collection, so `/research/...` pages render the original Markdown directly without copying it.
- `.agent/coverage/` records source-section to learning-section mappings.
- Learner progress is separate from content. The MVP uses browser `localStorage`; it does not synchronize across devices.

## Discovery

The canonical skills live in `.agent/skills/`. Thin adapters under `.agents/skills/` make them discoverable by Codex without duplicating the methodology. The main entry point is `deep-learn-visual`.

## Deterministic commands

```bash
node scripts/deep-learn-visual.mjs inspect model-context-protocol
node scripts/deep-learn-visual.mjs coverage model-context-protocol
node scripts/deep-learn-visual.mjs validate model-context-protocol --strict
npm test
npm run build
```

Deterministic validation checks files, metadata, mappings, anchors, imports, and duplicates. It cannot certify explanatory accuracy, diagram truthfulness, or educational quality; the agent-driven review in `evals/` remains mandatory.
