# Harness Audit — learning-notes

A full review of this repository as an agent harness, plus what I would change and why.

- **Date:** 2026-10-01
- **Repo commit:** `42b3f13`
- **Scope:** `.agents/`, `docs/`, `src/content/docs/`, `scripts/`, `AGENTS.md`, `README.md`, `prompt.md`
- **References read:** [`walkinglabs/learn-harness-engineering`](https://github.com/walkinglabs/learn-harness-engineering), [`mattpocock/skills`](https://github.com/mattpocock/skills)
- **Changes made to the repo:** none. This was a read-only review.

---

## Table of contents

1. [What I ran](#1-what-i-ran)
2. [The 10 things that matter most](#2-the-10-things-that-matter-most)
3. [Full findings](#3-full-findings)
   - [A. Broken state](#a-broken-state)
   - [B. Config that does nothing](#b-config-that-does-nothing)
   - [C. Vocabulary in two places](#c-vocabulary-in-two-places)
   - [D. The multi-page contract is unused](#d-the-multi-page-contract-is-unused)
   - [E. No progress, scope, or lifecycle](#e-no-progress-scope-or-lifecycle)
   - [F. Skills](#f-skills)
   - [G. Small hygiene issues](#g-small-hygiene-issues)
4. [Token and context economy](#4-token-and-context-economy)
5. [Recommendations](#5-recommendations)
6. [Suggested order of work](#6-suggested-order-of-work)

---

## 1. What I ran

Every gate in the repo, run for real:

| Command | Result |
| --- | --- |
| `npm run doctor` | **FAIL** — 2 orphan errors |
| `node .agents/bin/deep-learn.mjs validate --all --strict` | pass (1 topic) |
| `node .agents/bin/deep-learn-visual.mjs validate --all --strict` | **FAIL** — orphan learning page |
| `npm test` | pass — 31/31 |
| `npm run build` | pass — 56 pages |
| `npm run harness:check` | **exit 1** |

**The headline problem:** the repository's own aggregate gate is red, and `README.md` documents that gate as the verification path. Everything else in this document is secondary to that.

I also proved the config bug by scanning `.agents/`, `scripts/`, and `src/` for each key in `.agents/config.json`:

```
WITH history included (what doctor does): 41 keys, 0 dead
WITHOUT history (correct answer):          41 keys, 22 dead
```

And I proved the `review-learning` conflict by building a throwaway fixture. Both proofs are quoted in the findings below.

---

## 2. The 10 things that matter most

If you only read one section, read this.

| # | Problem | Why it hurts | Fix |
| --- | --- | --- | --- |
| 1 | `harness:check` always fails | A permanently red gate teaches agents that gates are optional | Restore or remove the MCP research package |
| 2 | `review-learning` breaks the visual validator | Two skills fight over one topic | Exclude `review/` from coverage validation |
| 3 | 22 of 41 config keys do nothing | Reading them wastes context and lying keys mislead agents | Wire them or delete them |
| 4 | The check for #3 is itself broken | The gate meant to catch config rot is defeated by `history/` | Skip `.agents/history/` in `unconsumedConfigKeys` |
| 5 | `UNVERIFIED` is policy-required but validator-banned | Agents get punished for honest labels, so they write vague prose | Pick one vocabulary |
| 6 | `progressStorageKey` says `v2`, code uses `v1` | "Fixing" the config silently wipes every learner's progress | Align them |
| 7 | No progress file, no feature list, no handoff | Every session re-pays full context cost from zero | Add `PROGRESS.md` and `features.json` |
| 8 | Objectives are collected but never checked | Harness validates structure, never learning outcomes | Add objective→assessment coverage |
| 9 | No CI | Every gate is manual, so every gate is optional | Add a GitHub Actions workflow |
| 10 | Skill routing is undefined | "Review my learning" matches two skills with different write permissions | Add an invocation field and a router table |

---

## 3. Full findings

### A. Broken state

#### A1. `npm run harness:check` exits 1, permanently — **P0**

`docs/model-context-protocol/` was deleted, but two things that depend on it are still present:

- `src/content/docs/ai-engineering/model-context-protocol/index.mdx`
- `.agents/coverage/model-context-protocol.md` (15KB, mapping 100+ headings into a page that can never validate)

Both are reported by `doctor` (`deep-learn.mjs:632`, `:653`) and by the global contract (`learning-contract.mjs:267`).

`README.md:60` acknowledges this in prose. That is the problem: the failure is now documented background noise, and every future run of `validate --all --strict` inherits it. Agents learn fast that a failing check is normal.

**Fix:** restore the research package, or delete/quarantine the page and coverage map. Nothing else in this document matters as much.

---

#### A2. `review-learning` produces output that breaks `deep-learn-visual validate` — **P0**

`review-learning` writes `docs/<slug>/review/review.md`. The visual validator walks **every** `.md` under `docs/<slug>/` and demands a coverage row for every level-two heading (`deep-learn-visual.mjs:347-353`).

I reproduced this in a clean fixture:

```
Error: .agents/coverage/demo.md: unmapped source section: review/review.md::Scope
Error: .agents/coverage/demo.md: unmapped source section: review/review.md::Coverage
Learning validation failed with 3 error(s) and 0 warning(s).
```

So running a review silently poisons the visual layer for that topic. Two skills, one contract, no test.

This has never surfaced because `review-learning/SKILL.md:76` tells the agent to run only `deep-learn.mjs validate`, which does not have this rule.

**Fix:** exclude `review/` from coverage source scanning, and add a regression test.

---

#### A3. The honesty label is banned by the validator — **P0**

Three files disagree:

| File | Says |
| --- | --- |
| `.agents/policies/research-policy.md:22` | "mark it `UNVERIFIED`" |
| `.agents/templates/research/lesson.md:8` | ships `versions: "UNVERIFIED"` |
| `.agents/bin/deep-learn.mjs:329-330` | rejects `\bUNVERIFIED\b` and `\bNOT RUN\b` in strict mode |

And `review-learning/SKILL.md:66` works around it by telling the agent to write "unconfirmed" in plain words instead.

Net effect: the policy tells authors to use a word the gate punishes, and the workaround degrades a precise status into vague prose. An agent optimizing for a passing gate will learn to write "unconfirmed" everywhere, which is strictly worse than an honest label.

**Fix:** pick one vocabulary. Either the validator accepts `UNVERIFIED` with a required justification next to it, or the policy and templates change to the plain-word form.

---

#### A4. `progressStorageKey` is a lie — **P1**

`config.json` says `deep-learn-visual:v2`. All three components hardcode `deep-learn-visual:v1`:

- `KnowledgeCheck.astro:45`
- `LearningDashboard.astro:70`
- `RevisionStatus.astro:23`

Nobody reads the config key. The moment someone "fixes" the config to match intent, every learner's existing progress is silently orphaned with no migration and no error.

**Fix:** align them now, before any progress exists to lose.

---

### B. Config that does nothing

#### B1. 22 of 41 config keys have no consumer — **P0**

I scanned every `.mjs`, `.js`, `.ts`, `.tsx`, `.astro`, `.md`, and `.json` file under `.agents/`, `scripts/`, and `src/`, excluding the config file itself.

Keys with **zero** consumers:

```
preferredProgrammingLanguage        repositoryInvestigationDepth
preferredFrontendFramework          maximumPrimaryRepositories
preferredBackendEnvironment         projectIdeasEnabled
preferredMobileEnvironment          practicalExercisesEnabled
preferredCloudPlatform              requireVersionVerification
learningComponentsDirectory         includeProductionAnalysisByDefault
researchRoutePrefix                 progressStorage
progressStorageKey
validation.failOnBrokenLocalLinks   validation.reviewHtmlException
validation.requireIndexEntry        validation.requireCoverageMap
validation.requireResearchLink      validation.requireStableTopicId
validation.requireAstroBuild
```

Only these are actually read by code:

```
failOnNonMarkdownLearningFiles   harnessName        defaultMode
visualTemplateDirectory          taxonomyRegistry   learningDirectory
researchDirectory                coverageDirectory   outputDirectory
requiredCoreFiles(ByMode)        harnessRoot         version
```

Two specific lies worth calling out:

- **`reviewHtmlException`** is a config key whose behavior is hardcoded as a regex at `deep-learn.mjs:286`. Changing the config does nothing.
- **`failOnBrokenLocalLinks: true`** is decorative. Broken links are *always* fatal (`deep-learn.mjs:368-373`). Setting it to `false` does not relax anything.

---

#### B2. The check meant to catch B1 is itself broken — **P0**

`unconsumedConfigKeys` (`deep-learn.mjs:469`) scans `.agents/` **including `.agents/history/`**. Historical config snapshots repeat every key name, so the regex always matches and the warning never fires.

```
WITH history included (what doctor does): 41 keys, 0 dead
WITHOUT history (correct answer):          41 keys, 22 dead
```

`doctor` reports zero config warnings today. That is the most important bug in the file: the gate designed to catch config rot is defeated by the archive it is supposed to ignore.

The intent is already correct elsewhere — `:548` excludes history for the legacy-path check — which proves the exclusion was simply missed here.

The test at `deep-learn.test.mjs:160` passes because its fixture has no `history/` directory. **The test never exercises the real repository.**

**Fix:** exclude `.agents/history/` from the scan, then work through the 22 warnings it surfaces.

---

### C. Vocabulary in two places

#### C1. `RESEARCH_STATUSES` is exported by the contract, then ignored — **P1**

```js
// learning-contract.mjs:22  — the canonical list
export const RESEARCH_STATUSES = ['draft', 'researched', 'validated', 'needs-refresh'];

// deep-learn.mjs:315 — the same list, typed out again
if (!['draft', 'researched', 'validated', 'needs-refresh'].includes(metadata.status))
```

Same pattern for `SOURCE_TYPES` and `INSPECTION_STATUSES` (`deep-learn.mjs:23-39`), which live only in the CLI while every other enum lives in `contracts/`.

`docs/learning-harness-redesign/modules/05-harness-architecture.md:23-42` explicitly names this as the thing to eliminate.

The test at `deep-learn-visual.test.mjs:479` asserts that Astro and the harness share one vocabulary — but only for `PAGE_KINDS`, `LEARNING_LEVELS`, and `TAXONOMY_FACETS`. Statuses and source types are untested. The invariant is enforced for three enums and ignored for the other two.

**Fix:** import the constants instead of retyping them, and extend the existing test to cover them.

---

#### C2. Three dead imports in `deep-learn.mjs` — **P2**

`LEARNING_LEVELS`, `PAGE_KINDS`, and `TAXONOMY_FACETS` at line 17 — one occurrence each, which is the import statement itself. Also `statSync` at line 8.

---

#### C3. The "four access levels" are prose only — **P1**

`learning.level` is declared in `content.config.ts` and in the contract. `requiredLearningLevels` in config is consumed only by a test.

No published page sets `level`. Grepping `src/content/docs` for `level:` returns nothing.

`rules/learning-experience.md` mandates four access levels. Nothing can detect their absence, so the rule is advice, not a contract.

---

### D. The multi-page contract is unused

#### D1. Zero pages use the new contract — **P1**

Only one page declares `learning:`, and it uses the legacy shape — `id` only, no `topicId`, `pageId`, `kind`, or `objectiveIds`. It is **3,789 words on a single page**.

That is exactly the failure `modules/01-current-diagnosis.md:37-53` diagnosed and `modules/03` was written to fix. The contract is real and tested; the content has not migrated.

So the harness currently proves it *can* express multi-page topics, and ships a single mega-page.

---

#### D2. `objectiveIds` are collected but never checked — **P0**

`learning-contract.mjs:78-81` parses `objectiveIds`, `assessmentIds`, `conceptIds`, and `labIds`. The only rule is "a non-overview page needs at least one objective" (`:115`).

Nothing asks whether an objective has an assessment, whether an assessment has a page, or whether a lab exists.

`modules/05-harness-architecture.md:144-148` lists this as **Gate D**. Gate D does not exist.

**This is the gap that matters most for learning quality.** The harness validates structure rigorously and learning outcomes not at all.

---

#### D3. The `coverage` command is misnamed — **P2**

`deep-learn-visual.mjs coverage <slug>` calls `runValidation` — the identical code path as `validate`. Running it right now prints:

```
Learning validation passed for 1 topic(s): 218 source sections, 0 coverage rows, 0 warning(s)
```

It reports **zero coverage as a pass**, because research-only topics skip coverage entirely (`:324-330`).

A command named `coverage` that reports zero coverage as success will be trusted by an agent as a real coverage report.

---

### E. No progress, scope, or lifecycle

Harness engineering treats five subsystems as the minimum viable harness. Here is where this repo stands:

| Subsystem | Status |
| --- | --- |
| Instructions | **Present.** `AGENTS.md`, 49 lines / 4.7KB. Healthy. |
| Verification | **Partial.** Two CLIs, 31 tests, no CI, aggregate gate red. |
| **State** | **Missing.** No progress file, no feature list, no session state. |
| **Scope** | **Missing.** No WIP limit, no activation record, no per-item done criteria. |
| **Lifecycle** | **Missing.** No handoff, no clock-in/clock-out, no resume budget. |

#### E1. There is no feature list — but `prompt.md` is one — **P0**

`prompt.md:58-110` defines Phases 0-6 with deliverables. That is a feature list in Markdown that nothing executes, versions, or verifies. Each phase's completion condition is prose: "Report files changed", "Add tests before migrating content".

It is the highest-value artifact in the repo and it is completely inert.

---

#### E2. Every session re-derives state from scratch — **P0**

No `PROGRESS.md`. No `.agents/state/`. No resume pointer.

A new session must read `docs/README.md`, run `doctor`, and infer what was in flight. `modules/07-multi-agent-orchestration.md:69-80` specifies a handoff envelope — task ID, files read, files changed, checks run, next task. Nothing writes it.

This is the real context cost: not any single file, but re-paying full price every session for state a 60-line file would summarize.

---

#### E3. No CI — **P1**

`.github/` does not exist. `prompt.md:104` lists "Add CI" as Phase 6.

Every gate is manual, so every gate is optional, which is why A1 has survived.

---

### F. Skills

#### F1. Invocation mode is undefined — **P1**

Only 2 of 9 skills ship `agents/openai.yaml` — `deep-learn` and `deep-learn-visual`, both with `allow_implicit_invocation: true`. Seven skills have no interface metadata at all.

Routing is therefore decided by description-matching alone, with no signal about whether a skill should fire on its own.

---

#### F2. `review-learning` collides with `deep-learn`'s review mode — **P1**

The repo already documented this as unfixed. `docs/learning-harness-redesign/README.md:139`:

> Review routing | "Review" matches two skills | Explicit intent router and write ownership

Current state:

| Skill | Claims |
| --- | --- |
| `deep-learn/SKILL.md:3` | "review ... and knowledge reviews" |
| `deep-learn/SKILL.md:13` | offers a `review` mode |
| `review-learning/SKILL.md:3` | review requests, including `/review-learning` |

Two skills, overlapping triggers, **different write permissions** — one may write `docs/<slug>/review/`, the other may edit the whole package.

---

#### F3. `review-learning` is 2x too large with the worst description — **P1**

| Skill | Size | Words | Description |
| --- | --- | --- | --- |
| `review-learning` | 10,315 chars | 1,525 | **508 chars** |
| `deep-learn` | 5,042 | 559 | 359 chars |
| `validate-learning-docs` | 1,368 | 165 | 219 chars |
| `generate-recall` | 1,068 | 142 | 195 chars |

The 508-char description ends with "including /review-learning requests" and lists "Kafka, MCP, vector embeddings" — keyword soup where trigger language must be front-loaded.

Descriptions are the **only thing every session pays for**. Guidance from the reference repo caps these near 150 chars, front-loaded.

---

#### F4. No skill index and no router — **P1**

`AGENTS.md` routes in three prose paragraphs. There is no table with trigger boundaries and negative triggers ("for X use Y instead"), and no equivalent of an `ask-matt` router for "which skill fits this?".

---

#### F5. No glossary — **P1**

`modules/05` makes "one source of truth" the thesis. There is no `GLOSSARY.md`.

Meanwhile `module` means three different things:

1. `docs/<slug>/modules/*.md` — a research chapter
2. `learning.kind: module` — a page role
3. `.agents/templates/visual/module.mdx` — a child page scaffold

`level`, `topic`, `page`, and `overview` also have no written definitions anywhere the CLIs read.

---

#### F6. `harness-insight.html` — **P2**

64KB of hand-written HTML at repo root. Git-tracked, referenced by nothing, outside every validator's scope.

It is the artifact `review-learning` is supposed to generate — in the wrong place, tracked by no contract.

---

#### F7. Two lockfiles, no `packageManager` — **P2**

`package-lock.json` is tracked. `bun.lock` is present and untracked. `AGENTS.md:6` mandates `astro dev --background`, a bun-ism, while `package.json` scripts are npm. Installs are not reproducible.

---

#### F8. The harness depends on an app dependency — **P2**

`js-yaml` is a **direct dependency used only by `.agents/lib/frontmatter.mjs`**. The harness's frontmatter parser — the foundation of every validator — depends on an app-level package. An app refactor or dependency prune can break validation.

Also 11 Starlight plugins for a site with one learning page: `echarts`, `sharp`, `mermaid`, `astro-d2`, plus plugins for showcases, videos, view modes, tags, sidebar-topics, llms-txt, md-txt, heading-badges, image-zoom. Maintenance cost with no current payoff.

---

### G. Small hygiene issues

#### G1. Critical rules sit at the bottom of `AGENTS.md` — **P2**

Structure: Development → Documentation → DeepLearn → Review → Visual. The always-run commands are in the last third.

The file is 49 lines, which is genuinely good — better than most repos. The fix is ordering, not length: put the gate and the constraints at the top.

---

#### G2. Documentation says "Ask Codex" — **P2**

`docs/README.md:12,14` and `.agents/README.md` reference Codex. This session runs OpenCode. Harness references should name the actual runtime, or stay harness-agnostic.

---

## 4. Token and context economy

Measured, not estimated:

| Artifact | Size | When loaded | Verdict |
| --- | --- | --- | --- |
| `AGENTS.md` | 4.7KB / 476 words | every session | fine |
| `.agents/config.json` | 2.2KB | every skill start | **19/22 keys wasted** |
| `workflows/research.md` + `research-policy.md` | 11.1KB | every `deep-learn` start | heavy for a routing decision |
| All 9 SKILL.md bodies | 26.6KB | only the invoked one | fine, if descriptions are tight |
| All workflows + policies + rules + methodology | 35.8KB | routed | correct shape |
| `review-learning/SKILL.md` | 10.3KB / 1,525 words | on trigger | **too big for a workflow skill** |
| Skill descriptions (always resident) | ~2.3KB across 9 | always | `review-learning` is 22% of it |

### Where context is actually lost

**1. Everything is loaded "completely."**
Three skills say read config + workflows + policies *completely* at start. That is 13KB of policy before a single decision is made. The routing content in those files is a table; the detail is per-stage.

**2. No tier-1 metadata layer with state.**
`docs/README.md` is the closest thing and it is good — a 1.8KB topic table. But it carries **no state**: no in-progress marker, no next action, no freshness flag. So it cannot answer "where was I?" and the agent must read further.

**3. The entry file duplicates skill bodies.**
`AGENTS.md:33-40` restates the `review-learning` methodology. One sentence is a literal string duplicate of the skill file (verified by match). Every duplicate is a future contradiction.

**4. `prompt.md` competes for authority.**
6.1KB of phase instructions at repo root, next to `AGENTS.md`, describing work that is either finished or should be a feature list.

**5. Config keys are context with no behavior.**
2.2KB read to use 3 keys. Worse, a dead key is a *false promise* the agent will try to honor.

### The compounding factor

This repo has no state artifact, so **the full cost of every session is re-paying for context that a 60-line progress file would summarize in 20 lines.** That is the expensive waste here — not any individual file.

---

## 5. Recommendations

### 5.1 Maintain progress with one state file

Create `PROGRESS.md` at the repo root — 60 lines maximum:

```markdown
# Progress — updated <YYYY-MM-DD>

## Current state
One line: what is true right now.

## In flight
At most ONE item (WIP=1) + its verification command.

## Blocked
Blocker + who decides.

## Next session starts
Exact command, run first.

## Last green baseline
Commit sha + result of `npm run harness:check`.
```

Rules that make it survive sessions:

- Update it as the **first** action after any successful gate, and the **last** action before ending.
- **Never restate what the repo already proves.** If `doctor` can compute it, `doctor` prints it. The file records only what a machine cannot see.
- **Reference artifacts by path, never inline their content.** This is the two-step save invariant: full content goes in the topic file, one-line pointer goes here.

---

### 5.2 Stop building giant instruction files

`AGENTS.md` is already tier 1 and healthy. Formalize it:

| Tier | Contents | Target |
| --- | --- | --- |
| 1 — always | repo purpose, first-run commands, ≤15 hard constraints, state-file pointer, the single gate | ≤60 lines |
| 2 — on skill activation | the SKILL.md body | ≤400 words (currently 559 and 1,525) |
| 3 — per stage | policies, rules, methodology | already correct |

Two changes to tier 1:

**Replace the three prose blocks with one routing table:**

| Request | Skill | May write | Gate |
| --- | --- | --- | --- |
| research a topic | `deep-learn` | `docs/<slug>/` | `deep-learn validate --strict` |
| audit my learning | `review-learning` | `docs/<slug>/review/` only | `deep-learn validate` |
| publish as a lesson | `deep-learn-visual` | `src/content/docs/` | both validators + build |

**Add provenance metadata to every rule that stays:**

```markdown
- Never restore `docs/model-context-protocol/` without explicit confirmation.
  why: pre-existing user deletion, not harness output.
  source: prompt.md:29. remove when: the user restores or confirms removal.
```

Without `remove when`, instructions only accumulate and contradictions become inevitable. This repo already has 22 stale config keys proving the decay happens here.

---

### 5.3 Maintain the feature list as data, not prose

**This is the single highest-leverage change.** The feature triple is **behavior + verification command + current state**, with one rule: only verification may set `passing`.

Convert `prompt.md`'s phases into `.agents/features.json`:

```json
{
  "features": [
    {
      "id": "multi-page-topic",
      "behavior": "One topic publishes one overview plus N focused child pages, with shared topicId and unique pageId/route.",
      "verify": "npm test && node .agents/bin/deep-learn-visual.mjs validate --all --strict",
      "state": "blocked",
      "blocked_by": "docs/model-context-protocol/ deleted; orphan page and coverage map unresolved",
      "owner": "src/content/docs/ai-engineering/model-context-protocol/index.mdx"
    }
  ]
}
```

Then:

- Add `node .agents/bin/harness.mjs features` that runs each active feature's `verify` and reports **VCR = passing / activated**. **VCR below 1.0 means you activated something you have not finished.** That is exactly the failure this repo is living right now.
- `doctor` refuses `state: passing` unless the recorded verify command exited 0 for the current HEAD.
- Enforce **WIP = 1** active feature. `modules/07:51-65` already states the rule; nothing enforces it.

Delete or archive `prompt.md` once its phases are features. A phase list in prose is an unvalidated feature list, and it will drift within one release.

---

### 5.4 Make the learning path concrete and validated

The gap: structure is validated rigorously, learning outcomes are not validated at all.

**Add objective coverage (Gate D, for real).** Require:

- every `objectiveIds` entry resolves to an assessment on some page of the same topic
- every page declares a `conceptIds` entry that appears in the research package
- every `labIds` entry resolves to a section in `implementation.md` or `exercises.md`
- report it as a number: `objectives with an assessment / total objectives`

That number is the learning analogue of VCR, and it turns "the page exists" into "the learner can be assessed on this."

**Order the termination check.** Every skill's Finish section currently lists gates unordered. Make three layers explicit and non-skippable:

```
Layer 1  static    deep-learn validate --strict      → structural truth
Layer 2  runtime   npm test                          → 31 assertions
Layer 3  system    npm run harness:check && build    → proves the repo is coherent

Do not proceed to layer 2 if layer 1 fails.
```

**Require evidence receipts.** Add `verify-receipt.mjs`: given a slug, re-run the topic's gate and write `.agents/evidence/<slug>.json` with `{sha, commands, exit_codes, timestamp}`. Completion envelopes cite a receipt rather than asserting. This makes "never claim completion if a required check fails" machine-checkable.

**Make verification independent.** `modules/07:22` says the verifier must not edit what it verifies; `prompt.md:44` repeats it. Make it structural: a `verify-topic` skill designed to run as a subagent with read-only scope, emitting per-objective verdicts to `.agents/reviews/<slug>-<date>.md`. Self-evaluation is systematically over-positive — the fix is a separate context, not better instructions.

**Interleave recall.** `modules/04:104-118` correctly notes the MCP page puts all six checks at the end. Once migrated to multiple pages, place a prediction check right after each mechanism and keep one consolidated review page. Enforce with a coverage-map column rather than prose.

---

### 5.5 Skills: management, authoring, workflow

#### Target layout

```
.agents/skills/<name>/SKILL.md           # name, description, invocation
.agents/skills/<name>/agents/openai.yaml # interface + policy (all 9, not 2)
.agents/skills/<name>/references/*.md    # depth, loaded only when relevant
.agents/skills/<name>/templates/*        # copyable artifacts
.agents/skills/<name>/evals/evals.json   # representative quality checks
```

#### Frontmatter contract

```yaml
---
name: review-learning
description: Audit one topic's notes, project evidence, and official docs; rate coverage; recommend repos.   # ≤150 chars, trigger first
invocation: user   # user | model
---
```

Two rules from the references that this repo violates today:

- **Invocation is an explicit axis.** A user-invoked skill must be `allow_implicit_invocation: false` so it never fires on an ambiguous request. `disable-model-invocation: true` and `allow_implicit_invocation: false` must stay in sync — a skill is user-invoked in both harnesses or neither.
- **Description length is a budget.** Every session pays for every description. Cap near 150 chars, front-load the trigger, strip keyword lists. `review-learning` goes 508 → ~130.

#### Add a router

`AGENTS.md` gets a five-column table: **request → skill → write scope → gate → for X use Y instead.**

That last column kills F2. `review-learning` vs `deep-learn` review mode becomes unambiguous:

- `review-learning` — audits an existing package against official docs, writes **only** `docs/<slug>/review/`
- `deep-learn --mode review` — runs an interactive dialogue, writes `revision.md`

Different verbs, different permissions, different triggers.

#### Which skills to add

You have nine. Add four and split one:

| Skill | Purpose | Fixes |
| --- | --- | --- |
| `verify-topic` | Read-only, subagent-dispatched. Runs the three-layer check, writes per-objective verdicts | Missing Gate F |
| `session-start` / `session-handoff` | Clock-in reads `PROGRESS.md` + runs `harness:check`; clock-out updates state + re-runs | E2 |
| `migrate-content` | Split a research-only topic into one overview + N children, write coverage map, preserve routes | The repeated operation with no skill |
| `explain` | Explicit no-write intent | An ordinary question currently becomes a research package |
| split `review-learning` | Keep routing + rating rubric in `SKILL.md`; move coverage construction and templates to `references/` + `templates/` | 1,525 words is too big |

`explain` matters more than it looks. `modules/04:37-46` lists six intents; the harness has skills for four. `explain` is the one with no skill — so the tempting path is to create a research package. A skill that explicitly writes nothing removes the temptation.

#### Skill authoring workflow

1. **Write the trigger phrase first**, in ≤150 chars. If you cannot say when it fires, do not write the skill.
2. **Write the done condition as a checkable predicate**, not a vibe. The model to copy is `to-questionnaire`'s: *"the file exists and every item the user named in step 2 is covered by a question."* Enumerable, not aesthetic.
3. **Write the negative space explicitly.** `modules/07:22` already says publishers may not add claims — make it a line in every publishing skill.
4. **Route by reference, not duplication.** Shared vocabulary → `GLOSSARY.md`. Shared rules → `.agents/policies/`. Two skills needing the same rule read the same file.
5. **Register it:** `openai.yaml`, routing table row, and a `doctor` check that every skill has both.
6. **Validate it:** a test that walks every `SKILL.md`, parses frontmatter, checks required fields, checks description length, and confirms every relative link resolves. Today `doctor` verifies harness links (`:558-570`) but validates no skill frontmatter at all.

#### What to take from the references — and what not to

**From `walkinglabs/learn-harness-engineering`:**

- the five-subsystem audit (this repo fails three of five)
- WIP = 1
- the feature triple with verification-only state transitions
- three-layer termination check with independent judges
- index hard-capped near 200 lines / 25KB, one line per entry
- "add the smallest artifact that directly addresses the observed failure mode" instead of growing the entry file
- their own caveat that numerical cutoffs are teaching defaults, not measured thresholds — which is why "≤60 lines" above is a review trigger, not a law

**From `mattpocock/skills`:**

- invocation as an explicit axis, kept in sync across harnesses
- done conditions as predicates
- the two-step save invariant
- reference-don't-duplicate in handoffs
- `teach`'s "learning records" as the ADR analogue for evidence, with explicit **non**-triggers — *"coverage is not learning, wait for evidence"*
- `teach`'s `MISSION.md` gate: refuse to proceed when the learner's goal is unstated. This repo has no equivalent, and `modules/04:9` diagnoses exactly that absence
- `GLOSSARY.md` with `_Avoid_` aliases
- `ask-matt` as a maintained router that must be updated whenever a skill changes — because a router that lies is worse than no router

**Do not take:**

- their `teach` skill writes self-contained HTML lessons into the workspace. This repo's validator explicitly forbids non-Markdown under `docs/` (`config.json:49`).
- their `handoff` writes to the OS temp directory. A learning harness needs durable in-repo state.
- their `wait-what` depends on a `GLOSSARY.md` this repo does not have — which is the argument for creating one.

---

## 6. Suggested order of work

| # | Action | Why now |
| --- | --- | --- |
| 1 | Resolve A1: restore or remove the MCP research package, its page, and its coverage map | Turns the red gate green; unblocks everything |
| 2 | Fix `unconsumedConfigKeys` to skip `.agents/history/`, then work the 22 warnings | The gate meant to catch config rot is itself rot |
| 3 | Delete the dead config keys or wire them. Fix A3 (`UNVERIFIED`) and A4 (`progressStorageKey`) | Config stops lying; honest labels stop being punished |
| 4 | Convert `prompt.md` → `.agents/features.json` + a `features` command reporting VCR | Makes scope and done-ness machine-checkable |
| 5 | Add `PROGRESS.md` and clock-in/clock-out | Fixes the resume cost that makes every session expensive |
| 6 | Fix A2 with a `review/` exclusion in coverage validation, plus a regression test | Two skills currently fight each other |
| 7 | Unify vocabularies (C1), drop dead imports (C2) | Cheap; removes the "one vocabulary" contradiction |
| 8 | Restructure skills: `openai.yaml` for all 9, `invocation` field, ≤150-char descriptions, router table, split `review-learning` | Deterministic routing; cuts always-resident tokens |
| 9 | Add `GLOSSARY.md` | Prerequisite for the router and for fixing three meanings of "module" |
| 10 | Add objective/assessment coverage to the visual validator (D2) | Converts structure validation into outcome validation |
| 11 | Add `verify-receipt.mjs` + `verify-topic` subagent skill | Makes "validated before reporting" enforceable; makes Gate F independent |
| 12 | Add `.github/workflows/` running `harness:check` + `npm test` + `build` | Makes gates non-optional |
| 13 | Migrate the MCP page to one overview + N children as the pilot | Proves the contract in production; `modules/08` already sequences this |
| 14 | Delete or relocate `harness-insight.html`; pick one lockfile; set `packageManager` | Hygiene |

**Items 1-3 are small and unblock everything else. Item 4 is the one that turns this from a document set into an instrumented system.**

---

## Appendix — commands used

```bash
npm run doctor
node .agents/bin/deep-learn.mjs sync --check
node .agents/bin/deep-learn.mjs validate --all --strict
node .agents/bin/deep-learn-visual.mjs inspect model-context-protocol
node .agents/bin/deep-learn-visual.mjs coverage learning-harness-redesign
node .agents/bin/deep-learn-visual.mjs validate --all --strict
npm test
npm run build
npm run harness:check
git log --oneline -20
git status --short
```

### Files read in full

`AGENTS.md`, `README.md`, `prompt.md`, `docs/README.md`, all 9 `.agents/skills/*/SKILL.md`, `.agents/config.json`, `.agents/README.md`, `.agents/bin/deep-learn.mjs`, `.agents/bin/deep-learn-visual.mjs`, `.agents/contracts/learning-contract.mjs`, `.agents/contracts/taxonomy.mjs`, `.agents/lib/frontmatter.mjs`, `.agents/lib/markdown.mjs`, all `.agents/policies/`, all `.agents/rules/`, all `.agents/evals/`, `.agents/workflows/research.md`, all `.agents/workflows/visual/`, all `.agents/commands/`, `.agents/registry/`, `.agents/history/`, `package.json`, `tags.yml`, `docs/learning-harness-redesign/README.md`, `docs/learning-harness-redesign/revision.md`, modules 01, 04, 05, 07, `src/content.config.ts`.

### Verified claims

- Config key audit — both figures reproduced by scanning `.agents/`, `scripts/`, `src/`
- `review/` coverage conflict — reproduced in a throwaway fixture under `/tmp`, twice
- Storage key mismatch — grepped all three learning components
- Skill description lengths — measured from frontmatter
- Orphan artifacts — reported by `doctor --json`
- Test suite — 31 pass, `harness:check` exit 1