# Module 5 — Harness architecture and quality gates

## Learning objective

After this module, you should be able to turn methodology prose into machine-enforced contracts, safe state transitions, and useful quality gates.

## The architecture principle

A harness is not a folder of prompts. It is a system that:

1. accepts an intent;
2. reads the minimum relevant context;
3. produces a bounded artifact;
4. validates structure;
5. requests independent semantic review;
6. transitions state;
7. preserves the next update path.

The current repository has many of these ideas in prose, but the machine contract is incomplete.

## One source of truth

Do not let the same vocabulary live independently in:

- a Markdown policy;
- a template;
- a JavaScript array;
- an Astro Zod schema;
- a config file;
- a generated HTML report.

Choose one canonical vocabulary and generate or validate the other representations.

Examples of canonical vocabularies:

- intent and mode values;
- research status values;
- source inspection statuses;
- relation types;
- page roles;
- assessment categories;
- coverage statuses.

## Shared parser strategy

The repository currently has multiple frontmatter parsers. Replace them with:

- one YAML parser;
- one canonical schema package;
- Astro schemas generated from or checked against that package;
- one route resolver;
- one anchor/slug implementation;
- shared error types;
- optional `--json` output for automation.

A parser that is slightly wrong in three places is three bugs waiting to happen.

## Topic manifest

A topic manifest is the machine-readable contract for a topic. It should contain:

- stable topic ID;
- title and summary;
- taxonomy IDs;
- prerequisite IDs;
- version boundaries;
- research route;
- overview and child page routes;
- objectives;
- concept IDs;
- assessment IDs;
- lab IDs;
- evidence references;
- publication state;
- freshness state;
- review history.

The manifest is not a replacement for research. It tells the system how research, learning pages, labs, and reviews relate.

## State machines

Research and publication should not share one status string.

### Research state

```text
draft → researched → validated → needs-refresh
```

### Publication state

```text
planned → published → incomplete → archived
```

### Learner state

```text
not-started → learning → practiced → assessed → mastered
```

A single topic can be `validated` in research while its visual pages are still `planned`.

## Safe transitions

A transition command should:

1. check preconditions;
2. run relevant validators;
3. record who requested it and when;
4. update derived frontmatter/indexes;
5. refuse invalid transitions;
6. leave a recoverable journal.

Do not let an agent type `status: validated` and call it done.

## Quality gates by concern

### Gate A: configuration

- every declared config key is consumed;
- values are schema-valid;
- no contradictory duplicate vocabulary;
- no unreferenced adapter or command.

### Gate B: content graph

- every topic has one overview;
- every page has a unique ID and route;
- every page belongs to an existing topic;
- no orphan pages, manifests, coverage maps, or research topics;
- prerequisite graph is acyclic.

### Gate C: evidence

- important claims have sources;
- source status and version are valid;
- research and learning versions are compatible;
- links and anchors resolve;
- limitations remain visible.

### Gate D: learning design

- every objective has a page and assessment;
- every module has a mental model and next step;
- every substantive topic has practice or transfer evidence;
- recall questions are near their target concept;
- page count and cognitive load are reviewed.

### Gate E: application

- Astro schemas pass;
- production build passes;
- accessibility and keyboard checks pass;
- research custom routes are validated;
- progress storage handles errors;
- deployment URLs are correct.

### Gate F: semantic review

An independent reviewer records:

- objective-by-objective judgment;
- technical accuracy;
- source fidelity;
- learner usability;
- unresolved limitations;
- required follow-up.

A semantic review cannot be replaced by a file-existence check.

## Recoverable commands

Useful commands should be boring and composable:

```text
classify
plan
research
model
author
publish
practice
review
doctor
sync --check
validate
transition
```

Each command should be:

- idempotent where possible;
- explicit about writes;
- safe against partial failure;
- able to emit JSON;
- able to explain why it refused.

## Multi-agent safety

Parallel agents are useful only after the manager has defined:

- stable IDs;
- file ownership;
- dependency order;
- merge rules;
- independent verification.

Do not let two agents author overlapping pages “and reconcile later.” That creates duplicate concepts and conflicting metadata.

## Interactive gate design

For each failure below, decide which gate catches it and what the error should say:

| Failure | Gate | Error category |
| --- | --- | --- |
| Two pages share `pageId` | content graph | duplicate page ID |
| Page points to missing research | content graph | orphan learning page |
| Relative link is broken | link validation | broken internal link |
| Objective has no assessment | learning design | uncovered objective |
| Source version is stale | freshness | stale evidence |
| Page is huge but coherent | cognitive-load review | split recommended |
| Author makes a technical claim without evidence | semantic review | unsupported claim |
| Storage is full | application | progress unavailable |

## Checkpoint

<details>
<summary>What is the highest-leverage first harness change?</summary>

**Answer:** Make the desired content shape legal and testable: one overview plus multiple pages with separate `topicId` and `pageId`. Once that contract is real, prompt and agent improvements can express the intended architecture.

</details>

## Takeaways

- One vocabulary, one parser, one schema.
- Manifests turn methodology into contracts.
- State transitions should be commands, not prose promises.
- Structural, evidence, learning, application, and semantic gates answer different questions.
- Recoverability and cross-layer graph checks matter as much as happy-path validation.

## Next

[Module 6 — Astro learning experience](06-astro-learning-experience.md)
