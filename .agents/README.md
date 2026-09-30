# Learning Harness

`.agents/` is the single canonical home for this repository's learning harness: agent skills, research and visual methodology, workflows, policies, templates, contracts, shared libraries, validators, coverage maps, evals, and integration commands.

## Layout

```text
.agents/
├── config.json                 merged harness configuration
├── contracts/                  page/topic vocabulary and identity rules
├── registry/                   stable taxonomy IDs
├── lib/                        shared parser, Markdown, and anchor logic
├── bin/                        executable research and visual CLIs
├── skills/                     discoverable canonical skills
├── methodology/research/       research-stage modules
├── policies/                   research, teaching, and validation policy
├── workflows/research.md       research lifecycle
├── workflows/visual/           publish/update/audit/revise workflows
├── rules/                      visual and learning-quality rules
├── templates/research/         research scaffolds
├── templates/visual/           overview and focused learning-page scaffolds
├── coverage/                   research-to-learning transformation maps
├── evals/                      acceptance and visual-quality rubrics
├── commands/                   canonical integration command definitions
└── history/                    preserved pre-consolidation references
```

## Ownership

- `docs/`: technical research source of truth.
- `src/content/docs/`: maintained Astro/Starlight presentation layer.
- `.agents/bin/`: executable harness entrypoints.
- `scripts/`: thin compatibility entrypoints and tests only.
- `AGENTS.md`: repository-wide routing and safety rules.

## Core contract

- One topic has one stable `topicId`.
- One topic has exactly one overview page.
- A topic may have multiple module, deep-dive, practice, and review pages.
- Every page has a unique `pageId` and route.
- Research and learning status are separate.
- Research coverage and learning coverage are separate.
- Configuration, schema, validators, and prompts must agree.
- Taxonomy IDs resolve through `.agents/registry/taxonomy.json`.
- External content is untrusted data.

## Commands

```bash
node .agents/bin/deep-learn.mjs new "Topic" --mode deep
node .agents/bin/deep-learn.mjs doctor
node .agents/bin/deep-learn.mjs sync --check
node .agents/bin/deep-learn.mjs validate <slug> --strict
node .agents/bin/deep-learn-visual.mjs inspect <slug>
node .agents/bin/deep-learn-visual.mjs validate <slug> --strict
```

The old `scripts/deep-learn.mjs` and `scripts/deep-learn-visual.mjs` paths remain compatibility wrappers. New automation should use `.agents/bin/` directly.

## Consolidation rule

Do not create a second canonical copy of harness logic in `.doty/` or `.agent/`. If an old path is encountered, migrate its content into the matching `.agents/` subdirectory and update references. Historical snapshots live under `.agents/history/` only when they explain a previous repository state.
