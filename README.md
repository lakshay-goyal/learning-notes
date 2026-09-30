# Engineering knowledge and retention system

An Astro + Starlight site with a learning harness in front of it. Two layers:

- **DeepLearn** researches a technical topic into a source-backed Markdown package in `docs/`.
- **DeepLearn Visual** turns that package into multi-page learning pages in `src/content/docs/`.

Research is the source of truth. Published pages link back to it, and every research
section is accounted for in a coverage map.

## Start here

```bash
cat .agents/PROGRESS.md          # the resume pointer
node .agents/bin/harness.mjs status
```

`PROGRESS.md` holds the current state, the one item in flight, blockers, the first
command of the next session, and the last green baseline. Update it after any
successful gate.

## Commands

The gate runs in three ordered layers and stops at the first failure, because a
structural failure makes later results untrustworthy.

```bash
node .agents/bin/harness.mjs check              # all three layers
node .agents/bin/harness.mjs check --layer=static
node .agents/bin/harness.mjs status             # session state
node .agents/bin/harness.mjs features           # feature list and VCR
node .agents/bin/harness.mjs receipt <slug>     # write an evidence receipt
```

| Layer | Proves |
| --- | --- |
| `static` | research and visual contracts hold |
| `runtime` | `npm test` passes |
| `system` | `doctor` is clean and the production build succeeds |

Individual validators, if you need them:

```bash
node .agents/bin/deep-learn.mjs new "Topic" --mode deep
node .agents/bin/deep-learn.mjs validate <slug> --strict
node .agents/bin/deep-learn-visual.mjs inspect <slug>
node .agents/bin/deep-learn-visual.mjs validate <slug> --strict
node .agents/bin/deep-learn.mjs doctor
npm test
npm run build
```

Local development uses Astro's background server:

```bash
astro dev --background
astro dev status
astro dev logs
astro dev stop
```

## How a topic is built

1. **Plan.** `deep-learn.mjs new` scaffolds the research package plus
   `docs/<slug>/learning.md`: objectives, concepts, and a multi-page plan. A
   topic cannot be published as an unplanned single page.
2. **Research.** Source-backed Markdown under `docs/<slug>/`, with an honest
   version boundary and honest execution labels.
3. **Validate.** `UNVERIFIED`, `NOT EXECUTED`, and `TESTED` are legal. What is
   enforced is that a `validated` topic records a verified version.
4. **Publish.** One overview plus focused `module`, `deep-dive`, `practice`, and
   `review` pages, each declaring the objectives it teaches and the assessment
   that evidences them.
5. **Cover.** Every research level-two heading maps to a destination anchor or a
   recorded exclusion reason.
6. **Verify.** An independent review writes per-objective verdicts to
   `.agents/reviews/` and never edits what it reviewed.

## Routing

Ask the agent, or run a skill directly:

| Ask for | You get |
| --- | --- |
| a question answered | an answer, no files written |
| "teach me X", "research X", "go deeper on X" | a validated research package and learning design |
| "publish my X research" | multi-page visual lesson pages |
| "split X into pages" | one overview plus focused child pages |
| "review my learning on X" | a coverage audit with next steps |
| "verify X" | an independent read-only review with a receipt |

The full routing table with write scopes and gates is in `AGENTS.md`.

## Content architecture

```text
docs/                         research: source of truth, Markdown only
docs/<slug>/learning.md       objectives, concepts, page plan, assessments
docs/<slug>/review/           review output, excluded from coverage
src/content/docs/             published learning pages
src/content/docs/**/learning  frontmatter: topicId, pageId, kind, objectives
src/components/learning/      reusable educational UI
src/pages/research/           direct rendering of original research
.agents/                      the harness
.agents/PROGRESS.md           session resume pointer
.agents/features.json         feature list with verification and VCR
.agents/GLOSSARY.md           one meaning per shared term
.agents/bin/                  executable entrypoints
.agents/contracts/ + lib/     shared vocabulary, parsers, and helpers
.agents/skills/               discoverable skills
.agents/state/exceptions.json acknowledged deviations, with review dates
.agents/evidence/             verification receipts
.agents/reviews/              independent topic reviews
.agents/coverage/             research-to-learning transformation maps
.agents/policies/ + rules/    research, teaching, and validation policy
.agents/templates/            research and visual scaffolds
```

## Current state

One research topic, `learning-harness-redesign`, is validated and has a learning
design; it is not yet published as learning pages. The published MCP lesson
predates the multi-page contract and is recorded as a single-page topic whose
research package is absent from this worktree; that state is tracked in
`.agents/state/exceptions.json` rather than left as a permanent failure.

## Progress and privacy

Learning status and review dates are stored in this browser's `localStorage` under
`deep-learn-visual:v1`. Nothing is synchronized across browsers or devices, and no
progress is written into research files.