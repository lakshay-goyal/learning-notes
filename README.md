# Engineering knowledge and retention system

This Astro + Starlight application has two complementary layers:

- **DeepLearn** researches technical topics and preserves the complete, source-backed Markdown package in `docs/`.
- **DeepLearn Visual** turns that package into layered learning pages in `src/content/docs/` with diagrams, code walkthroughs, active recall, related knowledge, and browser-local revision scheduling.

Research remains the source of truth. Published learning pages link back to the exact research material and are checked against a section-level coverage map in `.agent/coverage/`.

## Use the harnesses

Ask the coding agent:

> Use DeepLearn Visual to publish my MCP research.

The discoverable entry point is `.agents/skills/deep-learn-visual/`; the canonical methodology and supporting skills live in `.agent/`. See [the DeepLearn Visual guide](.agent/README.md) for the workflow, update policy, and validation contract.

Useful commands:

```bash
# Research validation
node scripts/deep-learn.mjs validate model-context-protocol --strict

# Visual integration inspection and validation
node scripts/deep-learn-visual.mjs inspect model-context-protocol
node scripts/deep-learn-visual.mjs coverage model-context-protocol
node scripts/deep-learn-visual.mjs validate model-context-protocol --strict

# Repository tests and production build
npm test
npm run build
```

For local development, follow the repository instruction to use Astro's background server:

```bash
astro dev --background
astro dev status
astro dev logs
astro dev stop
```

## Content architecture

```text
docs/                         complete DeepLearn research (source of truth)
src/content/docs/             visual learning presentation
src/components/learning/      reusable educational UI
src/pages/research/           direct rendering of original research
.agent/                       canonical visual-learning methodology
.agents/skills/               agent-discovery adapters
scripts/deep-learn-visual.mjs deterministic integration validator
```

The first complete topic is [Model Context Protocol](src/content/docs/ai-engineering/model-context-protocol/index.mdx). Original research is rendered at `/research/model-context-protocol/` and its child routes.

## Progress and privacy

Learning status and review dates are stored in the current browser's `localStorage`. This local MVP does not synchronize across browsers or devices, and no progress is written into research files.
