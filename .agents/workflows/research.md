# DeepLearn research workflow

Governs new topics, incremental updates, and reviews. The orchestrator adapts
the shape to the topic: a protocol, a database, and a security topic do not
answer the same questions.

## Modes

| Mode | Select when | Required depth |
| --- | --- | --- |
| `quick` | A rapid working model is wanted | Definition, problem, mental model, one example, limits, further reading |
| `deep` | Default for substantive learning | Quick plus internals, APIs, mechanisms, alternatives, examples, sources |
| `production` | Deployment or "everything" is explicit | Deep plus applicable security, scale, reliability, performance, cost, testing |
| `codebase` | Internals or an open-source implementation is the goal | Pinned revision, entry points, execution flow, tests, itinerary, modification exercises |
| `review` | Retained understanding is the target | Interactive dialogue grounded in an existing package, then `revision.md` updates |

`production` when production architecture is explicit, `codebase` when source
analysis is the objective, otherwise the configured default.

Depth is configurable per mode in `.agents/config.json`. The profile decides which
files exist, not how long they are.

## New-topic stages

1. **Understand the request.** Extract topic, mode, audience, constraints, slug.
   Complete when ambiguities that would change the work are resolved or recorded
   as a stated assumption.
2. **Decide the intent.** An explanation stops here and answers in chat. A
   research request continues. Do not scaffold a package for a question.
3. **Inspect local knowledge.** Search `docs/` for the same or adjacent topics.
   Complete when reuse opportunities are known and duplicates are ruled out.
4. **Detect capabilities.** Web, docs, GitHub, filesystem, Git, shell, execution.
   Complete when unavailable capabilities and their consequences are recorded.
5. **Classify the topic.** Protocol, framework, library, language, architecture
   pattern, distributed system, infrastructure, database, AI/ML, security,
   methodology, production system, or source implementation. Complete when
   classification changed the questions.
6. **Scaffold.** `node .agents/bin/deep-learn.mjs new "<topic>" --mode <mode>`.
   This writes the research files *and* `learning.md` with objectives, concepts,
   and a page plan. Atomic: nothing half-written survives a failure.
7. **Design the learning.** Edit `learning.md` before research gets deep. Each
   objective must be demonstrable, and each must have an assessment.
8. **Define objectives and prerequisites.** Complete when every planned section
   supports an objective.
9. **Build the research plan.** Write questions, implementation detail,
   production concerns, alternatives, repository candidates, version targets, and
   stop conditions to `research-plan.md`. Complete before broad research.
10. **Research official sources.** Specification, documentation, releases,
    migrations, security guidance. Complete when important design and API claims
    have primary evidence or an explicit recorded gap.
11. **Research engineering practice.** Incident reports, maintainer
    explanations, papers, bounded community evidence, only where they add
    operational insight.
12. **Discover repositories.** Relevance, implementation depth, maintenance,
    tests, readability, license. Bounded by `maximumPrimaryRepositories`.
13. **Inspect source.** Pin a revision, verify every cited path, identify entry
    points, trace one meaningful end-to-end flow. Complete when findings
    distinguish inspected code from README-only discovery.
14. **Develop examples.** Minimal, then realistic, then production-oriented where
    relevant. Test what is safe to test and record the command and result;
    otherwise label it `NOT EXECUTED` with the reason.
15. **Analyze production concerns.** Only material dimensions. Complete when
    trade-offs and new failure modes are explained, not listed.
16. **Compare alternatives.** Prior approaches, overlap, and decision conditions.
    Complete when the comparison avoids universal winners.
17. **Teach the lesson.** Follow `.agents/policies/teaching-policy.md`. Cite near
    the claim.
18. **Create active learning.** Projects when `projectIdeasEnabled`, plus scenario,
    debugging, architecture, and source-reading exercises.
19. **Validate.** Deterministic gate, then the semantic gate.
20. **Save and index.** Update README metadata and history, run `index`.

## Incremental branch

For "go deeper", "update", or "add exercises":

1. Read the complete package, `learning.md`, and the update history.
2. Map the request onto existing coverage and sources.
3. Re-verify fast-changing facts. Never reuse a version-sensitive finding just
   because a URL was seen before.
4. Edit only the missing, stale, or contradicted areas unless a full refresh was
   asked for.
5. Preserve valuable prior work, explain changed conclusions, update sources,
   update `learning.md` if objectives changed, validate, and re-index.

Reuse a prior finding only when its URL, revision, access date, answered question,
and limitations are recorded and the claim is not freshness-sensitive.

## Review branch

For a live quiz of retained understanding, do not write a generic question set.
Read the package, extract its objectives, and conduct a progressive dialogue:
conceptual explanation, failure scenarios, architecture choices, debugging, and
source paths. Evaluate against the package and freshly verified facts, explain
gaps, then update `revision.md`.

`review-learning` is a different job: it audits written coverage against official
docs and writes `docs/<slug>/review/`. For a live quiz, use this branch.

## Status

| Status | Meaning |
| --- | --- |
| `draft` | scaffolded or materially incomplete |
| `researched` | evidence gathered and lesson written; semantic review pending |
| `validated` | both gates completed; limitations may remain documented |
| `needs-refresh` | important version-sensitive claims are stale or contradicted |

`validated` never means every fact is guaranteed. `requireVersionVerification`
rejects a `validated` topic whose `versions` field is still `UNVERIFIED`.

Publication state and learner progress are separate from all of these.