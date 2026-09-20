---
name: validate-learning-docs
description: Validate transformed learning documentation for research coverage, source traceability, MDX/component integrity, links, accessibility, responsiveness, performance, technical accuracy, and Astro production build quality.
---

# Validate Learning Docs

Read `.agent/evals/acceptance-tests.md`, `.agent/evals/visual-quality.md`, and the topic coverage map.

Run:

```bash
node scripts/deep-learn.mjs validate <slug> --strict
node scripts/deep-learn-visual.mjs validate <slug> --strict
npm test
npm run build
```

Then perform the semantic gate:

- compare learning claims, diagrams, code annotations, and version boundaries with the research and primary sources;
- confirm every level-two research section is mapped or intentionally excluded with a valid reason;
- verify deep access, source ledger, limitations, exercises, and personal findings remain recoverable;
- inspect keyboard behavior, reveal/focus handling, text alternatives, dark/light themes, and mobile overflow;
- confirm interactive work is localized and the static content remains useful without JavaScript;
- confirm the dashboard shows actual topics and honest empty/progress states.

Repair and repeat. Report mechanical results separately from agent-reviewed educational quality. Never treat a successful build as proof of factual correctness.
