---
name: validate-learning-docs
description: "Run the ordered validation gate and apply the learning-quality rubrics."
invocation: model
---

# Validate Learning Docs

Run the mechanical gate, then judge what the gate cannot see. Report the two
results separately: a green validator says nothing about whether a learner
understands the material.

## The gate, in order

```bash
node .agents/bin/harness.mjs check
```

Three layers, and the run stops at the first failure because a structural failure
makes later results untrustworthy:

| Layer | Proves |
| --- | --- |
| `static` | research and visual contracts hold |
| `runtime` | `npm test` passes |
| `system` | `doctor` is clean and the production build succeeds |

To narrow it while iterating, use `--layer=static`. For a single topic:

```bash
node .agents/bin/deep-learn.mjs validate <slug> --strict
node .agents/bin/deep-learn-visual.mjs validate <slug> --strict
node .agents/bin/deep-learn-visual.mjs inspect <slug>
node .agents/bin/harness.mjs receipt <slug>
```

## Then the semantic review

Mechanical checks cannot certify any of the following. Do each explicitly.

1. **Claim fidelity.** Compare every technical claim, diagram, and code
   annotation against the research and the cited primary source. A diagram that
   misstates direction or timing is worse than no diagram.
2. **Objective coverage.** Read `learning.md`. Confirm each objective is genuinely
   taught, not merely named, and that its assessment would actually evidence it.
   The validator checks that an objective ID appears; only reading checks meaning.
3. **Source depth.** Confirm important claims trace to a source whose inspection
   status is `ANALYZED` or `SOURCE_INSPECTED`, not merely discovered.
4. **Version boundary.** Confirm the pages describe the version the package
   recorded, and that a boundary change is visible to the reader.
5. **Coverage honesty.** Read `.agents/coverage/<slug>.md`. Confirm exclusions are
   legitimate and none conceals an unclosed gap.
6. **Deep access.** Confirm implementation, failures, production concerns, sources,
   limitations, and personal findings all remain reachable.
7. **Accessibility and responsiveness.** Keyboard reachability, focus handling,
   text alternatives for diagrams, dark and light themes, mobile overflow,
   reduced motion.
8. **Progressive enhancement.** Interactive work must be localized; the static
   content stays useful with JavaScript disabled.
9. **Honest empty states.** The dashboard shows real topics and admits when
   there is no progress rather than implying completion.

## Rubrics

Apply `.agents/evals/acceptance-tests.md` and `.agents/evals/visual-quality.md`.

## Repair and repeat

Fix what is fixable, rerun the gate, and re-review. When something cannot be
fixed, record it as a limitation in the package rather than passing it through
optimistic wording.

## Report

State separately:

- **Mechanical:** the commands that ran and their exit codes.
- **Semantic:** per-objective judgment, claim fidelity, source depth, accessibility.
- **Unresolved:** anything left open, stated plainly.

Never claim a topic is complete because the build succeeded.