# DeepLearn methodology

`.doty/` is the canonical methodology for this repository's personal technical research harness. It is not itself an agent-discovery directory. Codex discovers the thin integration skill at [`.agents/skills/deep-learn/SKILL.md`](../.agents/skills/deep-learn/SKILL.md), which routes work to these policies and modules.

## Contents

- [`workflow.md`](workflow.md): lifecycle, learning modes, state transitions, and completion rules.
- [`research-policy.md`](research-policy.md): source hierarchy, version discipline, citations, reuse, and trust boundaries.
- [`teaching-policy.md`](teaching-policy.md): explanation sequence and practical-example standards.
- [`repository-analysis.md`](repository-analysis.md): this repository's inspected integration constraints.
- [`validation-policy.md`](validation-policy.md): deterministic and agent-driven quality gates.
- [`config.json`](config.json): a small set of user-facing defaults.
- [`skills/`](skills/): reusable methodology modules selected by the orchestrator.
- [`templates/`](templates/): Markdown-only topic package templates.

The knowledge base lives in [`docs/`](../docs/). The harness never publishes it, changes the Astro application, deploys infrastructure, or creates paid resources as part of research.

## Deterministic commands

```bash
node scripts/deep-learn.mjs new "Distributed queues" --mode deep
node scripts/deep-learn.mjs index
node scripts/deep-learn.mjs validate --all
node scripts/deep-learn.mjs validate distributed-queues --strict
```

The `new` command never overwrites an existing topic. `validate --strict` is intended for a package the agent believes is complete; drafts produce warnings during ordinary validation.
