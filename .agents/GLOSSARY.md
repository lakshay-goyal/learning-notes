# Glossary

The shared vocabulary of this repository. One term, one meaning. If a document
needs a word this file does not define, add the definition here before using it
as a load-bearing concept.

Why this file exists: before it, `module` meant a research chapter
(`docs/<slug>/modules/*.md`), a page role (`learning.kind: module`), and a
template scaffold (`.agents/templates/visual/module.mdx`) at the same time.
Code that read "module" could not tell which one it meant.

Each entry records what the term is, what it is **not**, and where it is
enforced. `_Avoid_` lists synonyms that appear in older drafts and must not be
used for this concept going forward.

---

## Agent and harness terms

**Harness**
: The repository's instructions, contracts, validators, state, and skills taken
  together. A harness is not a folder of prompts; it is the system that accepts
  an intent, reads the minimum relevant context, produces a bounded artifact,
  validates structure, requests independent semantic review, transitions state,
  and preserves the next update path.
  _Avoid:_ scaffolding, framework.
  _Enforced by:_ `.agents/`, verified by `node .agents/bin/deep-learn.mjs doctor`.

**Skill**
: A discoverable `.agents/skills/<name>/SKILL.md` that names one job, states when
  it fires, and carries a checkable done condition. Skills are thin: they route to
  canonical methodology rather than restating it.
  _Avoid:_ command, prompt, agent, workflow file.
  _Enforced by:_ `doctor` checks frontmatter, `invocation`, and description length.

**Invocation**
: Whether a skill fires on its own (`model`) or only when the user asks
  (`user`). A user-invoked skill must also declare
  `allow_implicit_invocation: false`, so an ambiguous request cannot trigger it.
  _Avoid:_ enabled/disabled, implicit, trigger mode.
  _Enforced by:_ `doctor` skill checks; `.agents/skills/*/agents/openai.yaml`.

**Router**
: The skill-selection table in `AGENTS.md`. Its columns are request, skill, write
  scope, gate, and "for X use Y instead". A skill the router does not mention is
  a skill the agent cannot reliably reach.
  _Avoid:_ index, menu, dispatcher.
  _Enforced by:_ `doctor` reports any skill absent from `AGENTS.md`.

**Gate**
: A check that must pass before a claim of completion. Gates are ordered:
  static, then runtime, then system. A later layer does not run while an earlier
  one fails.
  _Avoid:_ test, check, lint.
  _Enforced by:_ `npm run harness:check`; `.agents/evals/acceptance-tests.md`.

**Feature**
: One entry in `.agents/features.json` carrying exactly three things: the
  observable behavior, the verification command that proves it, and the current
  state. Granularity is calibrated to "completable in one session".
  _Avoid:_ task, ticket, story, item.
  _Enforced by:_ `doctor` feature checks; `harness.mjs features`.

**VCR**
: Verification-completion ratio: passing features divided by activated features.
  VCR below 1.0 means something was activated and not finished.
  _Avoid:_ completion percentage, progress.
  _Enforced by:_ `node .agents/bin/harness.mjs features --json`.

**WIP**
: Work in progress. WIP = 1 is the default safe setting: finish one feature
  before starting the next. Overreach and under-finishing are the same failure.
  _Avoid:_ parallel tasks, queue depth.
  _Enforced by:_ `doctor` warns above one `in-progress` feature.

**Receipt**
: A machine-written record under `.agents/evidence/<slug>.json` containing the
  commit, the commands run, and their exit codes. A completion claim cites a
  receipt rather than asserting success.
  _Avoid:_ log, report, verification output.
  _Enforced by:_ `harness.mjs receipt`.

**Exception**
: A recorded, time-bounded decision in `.agents/state/exceptions.json` that the
  harness must stop reporting as an unknown failure. Each entry names what it
  covers, why, who decided, and when it must be revisited.
  _Avoid:_ waiver, suppression, ignore list.
  _Enforced by:_ `doctor` reports exceptions, their targets, and overdue reviews.

**Progress**
: The durable resume pointer at `.agents/PROGRESS.md`: current state, at most one
  item in flight, blockers, the first command of the next session, and the last
  green baseline. It records only what a machine cannot compute.
  _Avoid:_ status, changelog, journal, notes.
  _Enforced by:_ `doctor` progress checks.

---

## Learning content terms

**Topic**
: One bounded learning contract with one stable `topicId` and one research
  package at `docs/<slug>/`. A topic is not a page, and a topic is not a file.
  _Avoid:_ page, article, course, note, module.
  _Enforced by:_ `learning.topicId`; `contracts/learning-contract.mjs`.

**Page**
: One focused delivery unit of a topic at a unique `pageId` and a stable route.
  A page exists to reduce cognitive load, not to hit a length target.
  _Avoid:_ section, tab, chapter, topic.
  _Enforced by:_ `learning.pageId` uniqueness; route uniqueness.

**Module**
: In the research layer, one chapter of a research package under
  `docs/<slug>/modules/`. In the learning layer, a page whose `learning.kind` is
  `module`. Never both at once: a research module is not a learning page, and a
  learning module page is not a research chapter.
  _Avoid:_ page, section, chapter (use whichever of the two you mean).
  _Enforced by:_ `contracts/learning-contract.mjs` `PAGE_KINDS`.

**Overview**
: The single page of a topic whose `learning.kind` is `overview`. Exactly one
  exists per topic, and it carries the quick-recall level.
  _Avoid:_ index, landing page, summary, homepage.
  _Enforced by:_ `validatePageSet`.

**Learning design**
: The machine-readable contract at `docs/<slug>/learning.md`: objectives,
  concepts, the planned page set, and the assessment for each objective. It is
  what the visual stage plans against, so a topic cannot be published as an
  unplanned single page.
  _Avoid:_ outline, plan, template, manifest.
  _Enforced by:_ `validation.requireLearningDesignFile`; `deep-learn.mjs new`.

**Objective**
: An observable outcome the learner can demonstrate, named by a stable ID such as
  `<topicId>.<name>`. An objective that cannot be assessed by something other
  than recognition is a topic, not an objective.
  _Avoid:_ goal, topic, section, learning outcome (use the specific one).
  _Enforced by:_ `learning.objectiveIds`; objective/assessment coverage.

**Concept**
: A named idea the learner must be able to operate on, distinct from the page
  that teaches it. Concepts carry stable IDs so a page can be rewritten without
  renaming what it teaches.
  _Avoid:_ section, topic, term, definition.
  _Enforced by:_ `learning.conceptIds`; `docs/<slug>/learning.md`.

**Assessment**
: The evidence-producing activity attached to an objective: retrieval, a
  prediction, debugging, implementation, architecture, or a transfer question. An
  assessment is not a page and not a self-rating.
  _Avoid:_ quiz, test, check, question.
  _Enforced by:_ `learning.assessmentIds`; objective/assessment coverage.

**Lab**
: A bounded executable artifact that produces evidence: code, a test, a pinned
  commit, a reproduced failure, or an architecture decision. A paragraph
  describing what the learner could build is not a lab.
  _Avoid:_ exercise, tutorial, demo, workshop.
  _Enforced by:_ `learning.labIds`.

**Exercise**
: A prompt in the research package describing possible practice. Markdown
  exercises describe work; labs produce evidence.
  _Avoid:_ lab, assignment, practice.
  _Enforced by:_ `docs/<slug>/exercises.md`.

**Coverage**
: The mapping from a research level-two heading to a destination anchor, or a
  recorded exclusion reason. Reachability is not teaching: a row proves the
  material is findable, not that it is understood.
  _Avoid_: traceability, mapping, index.
  _Enforced by:_ `.agents/coverage/<slug>.md`; `validateCoverage`.

**Publication state**
: Whether a topic has learning pages. `research-only` is a legal state, not a
  failure: validated research with no pages yet.
  _Avoid_: status (that word means research status).
  _Enforced by:_ `PUBLICATION_STATES`; `doctor` publication notes.

**Research status**
: The research lifecycle: `draft`, `researched`, `validated`, `needs-refresh`.
  Separate from publication state and from learner progress. `validated` means
  both gates passed; it never means every fact is guaranteed.
  _Avoid_: publication state, progress, completion.
  _Enforced by:_ `contracts/research-contract.mjs`.

**Execution status**
: The honest label on a runnable example: `TESTED` with command, date, and
  result, or `NOT EXECUTED` with the reason. Banned-as-placeholder enforcement
  was removed precisely so honesty is not punished.
  _Avoid_: verified, works, works on my machine.
  _Enforced by:_ `EXECUTION_LABELS`; `sources.md` inspection statuses.

**Access level**
: One of the four depths a topic supports: `quick-recall`,
  `visual-understanding`, `complete-understanding`, `active-recall`.
  _Avoid_: difficulty, tier, page kind (a page carries both).
  _Enforced by:_ `LEARNING_LEVELS`; `content.config.ts`.

**Progressive disclosure**
: Making depth available without putting it on the default scan path. The default
  path stays short; the full research stays reachable through deep dives and
  `/research/` routes.
  _Avoid_: lazy loading, collapsing, hiding.
  _Enforced by:_ `.agents/rules/learning-experience.md`.

**Evidence**
: What a learner has actually demonstrated, kept distinct from exposure.
  Coverage is not learning: wait for evidence.
  _Avoid_: progress, completion, activity.
  _Enforced by:_ `.agents/reviews/<slug>-<date>.md`.

---

## Flagged ambiguities resolved

- **`module`** — split into research module (chapter) and learning module (page
  role). Both remain legal; they are never interchangeable.
- **`status`** — previously meant research status, publication state, or learner
  progress depending on the file. Now: *research status*, *publication state*,
  and *progress* are three separate terms with three separate fields.
- **`review`** — two skills claimed it. Now `review-learning` audits an existing
  package against official docs and writes only `docs/<slug>/review/`; the
  `review` research mode runs an interactive dialogue and writes `revision.md`.
- **`level`** — meant the four access levels in some files and page depth in
  others. Now *access level* is the only meaning.
- **`validation`** — meant "the validator ran", "the build passed", and "the
  agent reviewed it" interchangeably. Now *gate* is an ordered check and a
  receipt records what actually ran.
- **`orphan`** — a learning page without research, a coverage map without a
  topic, and an exception without a target are all called orphan. Only the first
  two are orphans; an exception without a target is a stale entry.