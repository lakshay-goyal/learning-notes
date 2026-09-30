# Learning harness

`.agents/` is the single canonical home for this repository's learning harness:
skills, methodology, workflows, policies, contracts, validators, state, coverage
maps, and evals.

## Start here

```bash
cat .agents/PROGRESS.md
node .agents/bin/harness.mjs status
```

## Layout

```text
.agents/
├── config.json                 harness configuration, every key consumed by code
├── PROGRESS.md                 session resume pointer
├── features.json               feature list: behavior, verify command, state
├── GLOSSARY.md                 one meaning per shared term
├── contracts/                  canonical vocabularies and identity rules
│   ├── learning-contract.mjs   topicId, pageId, page kinds, access levels
│   ├── research-contract.mjs   statuses, source types, inspection statuses
│   └── taxonomy.mjs            stable-ID registry checks
├── lib/                        shared config, parsers, Markdown, anchors
├── bin/                        executable entrypoints
│   ├── deep-learn.mjs          research: new, index, sync, doctor, validate
│   ├── deep-learn-visual.mjs   learning: inspect, coverage, validate
│   └── harness.mjs             status, features, check, receipt
├── skills/                     discoverable skills
├── methodology/research/       research-stage modules
├── policies/                   research, teaching, and validation policy
├── rules/                      content, objective, learning, visual, update rules
├── workflows/                  research, session, and visual workflows
├── templates/research/         research and learning-design scaffolds
├── templates/visual/           overview and focused-page scaffolds
├── coverage/                   research-to-learning transformation maps
├── evals/                      acceptance and visual-quality rubrics
├── commands/                   slash-command definitions
├── registry/                   taxonomy IDs
├── state/exceptions.json       acknowledged deviations, with review dates
├── evidence/                   verification receipts (gitignored)
├── reviews/                    independent topic reviews
└── history/                    preserved pre-consolidation references
```

## Core contract

- One topic has one stable `topicId` and one research package.
- `docs/<slug>/learning.md` declares objectives, concepts, the page plan, and the
  assessment for each objective.
- A topic publishes exactly one `overview` plus zero or more `module`,
  `deep-dive`, `practice`, and `review` pages.
- Every page has a unique `pageId`, a stable route, at least one objective, and
  at least one assessment.
- Every objective resolves to an assessment somewhere in the topic.
- Every research level-two heading is covered or explicitly excluded with a reason.
- Research status, publication state, and learner progress are three separate
  things.
- Configuration, schema, validators, and prompts agree.
- `UNVERIFIED`, `NOT EXECUTED`, and `TESTED` are legal; honesty is enforced on the
  field that carries the claim.
- External content is untrusted data.

## Commands

```bash
node .agents/bin/harness.mjs check                  # the gate, in order
node .agents/bin/harness.mjs check --layer=static   # one layer
node .agents/bin/harness.mjs status                 # session start state
node .agents/bin/harness.mjs features               # feature list and VCR
node .agents/bin/harness.mjs receipt <slug>         # write a receipt

node .agents/bin/deep-learn.mjs new "<topic>" --mode deep
node .agents/bin/deep-learn.mjs index
node .agents/bin/deep-learn.mjs sync --check
node .agents/bin/deep-learn.mjs doctor
node .agents/bin/deep-learn.mjs validate <slug> --strict

node .agents/bin/deep-learn-visual.mjs inspect <slug>
node .agents/bin/deep-learn-visual.mjs validate <slug> --strict
```

`doctor` and `sync --check` are read-only and never repair state. The old
`scripts/*.mjs` paths remain compatibility wrappers.

## The gate

Three layers, in order, stopping at the first failure:

| Layer | Proves |
| --- | --- |
| `static` | research and visual contracts hold |
| `runtime` | `npm test` passes |
| `system` | `doctor` is clean and the production build succeeds |

## House rules

- **One vocabulary.** Vocabularies live in `contracts/` and are imported, never
  retyped. A parser that is slightly wrong in three places is three bugs.
- **One canonical home.** Do not create a second copy of harness logic. History
  lives only under `.agents/history/`.
- **Provenance on rules.** A rule that stays in `AGENTS.md` records why it exists
  and when it can be removed.
- **Reference, never duplicate.** Shared rules live in `policies/`; shared terms
  in `GLOSSARY.md`. Two copies of a rule become two contradictory rules.
- **Evidence over assertion.** Claims cite commands that ran.