# DeepLearn workflow

This workflow governs new topics, incremental updates, and reviews. The orchestrator adapts the questions and package shape to the topic; it does not force every topic through an identical article outline.

## Modes

| Mode | Select when | Required depth |
| --- | --- | --- |
| `quick` | The user wants a rapid working model | Definition, problem, mental model, architecture, one example, uses, limitations, further reading |
| `deep` | Default for substantive learning | Quick plus internals, APIs/data structures, mechanisms, alternatives, multiple examples, and source references |
| `production` | The request emphasizes real deployment or “everything” | Deep plus applicable security, scale, reliability, performance, cost, deployment, observability, testing, and case studies |
| `codebase` | The request emphasizes internals or open-source implementation | Repository architecture, pinned revision, entry points, execution/data flow, tests, deployment, itinerary, and modification exercises |
| `review` | The user wants to evaluate retained understanding | Questions and scenarios grounded in an existing topic package, answer evaluation, weak areas, and focused follow-up work |

Choose `production` when production architecture is explicit and `codebase` when source analysis is the main objective. Otherwise default to the configured mode. Keep small topics proportionate.

## New-topic stages and completion conditions

1. **Understand the request.** Extract the topic, desired mode, audience perspective, constraints, output slug, and any explicit technologies. Complete when ambiguities that materially change the work are resolved or a documented reasonable assumption is available.
2. **Inspect local knowledge.** Search `docs/` for the same or adjacent topics and inspect relevant existing material. Complete when reuse and link opportunities are known and duplicate directories have been ruled out.
3. **Detect capabilities.** Check for web retrieval, GitHub/source access, filesystem, Git, shell, and code execution. Complete when unavailable capabilities and their consequences are recorded in the research plan.
4. **Classify the topic.** Select one or more of protocol, framework, library, language, architecture pattern, distributed system, infrastructure, database/storage, AI/ML, security, methodology, production system, or source implementation. Complete when classification has changed the research questions rather than merely labeling the topic.
5. **Define objectives and prerequisites.** State practical outcomes and concepts the learner must already understand. Complete when every planned section supports an objective.
6. **Build the research plan.** Write core questions, implementation details, production concerns, alternatives, candidate repositories, practical outcomes, and version-sensitive areas to `research-plan.md`. Complete before broad research begins.
7. **Research official sources.** Find the official site, specification, docs, repository, security guidance, examples, releases, and migrations that answer the plan. Complete when important design/API claims have primary evidence or an explicit gap.
8. **Research engineering practice.** Add primary engineering reports, incidents, maintainer discussions, papers, or carefully bounded community evidence only where they add operational insight. Complete when applicable real-world constraints are supported or honestly unavailable.
9. **Discover repositories.** Evaluate candidates for relevance, implementation depth, maintenance, tests, readability, license/access, and category. Complete when a small justified set is selected—or the absence of a suitable repository is recorded.
10. **Inspect source.** Pin a commit or release, verify every cited path, identify entry points and architecture, and trace at least one meaningful end-to-end flow for complex systems. Complete when findings distinguish inspected code from README-only discovery.
11. **Develop examples.** Progress from minimal to realistic and, only when relevant, production-oriented. Complete when prerequisites, versions, setup, run commands, behavior, errors, improvements, and execution status are recorded.
12. **Analyze production concerns.** Cover only material dimensions: architecture, scale, reliability, security, observability, performance, cost, deployment, and testing. Complete when trade-offs and new failure modes are explained rather than listed.
13. **Compare alternatives.** Explain prior approaches, overlap, implementation/operational differences, and decision conditions. Complete when the comparison avoids universal winners.
14. **Teach the lesson.** Apply the sequence in `teaching-policy.md`, link claims to evidence near the claim, and connect to useful existing topics. Complete when the reader can explain, implement, debug, and evaluate the concept at the selected mode.
15. **Create active learning.** Add beginner, intermediate, and advanced projects where enabled, plus scenario, debugging, architecture, and source-reading exercises appropriate to the topic.
16. **Validate.** Run deterministic validation, then perform the semantic review in `validation-policy.md`. Fix failures; preserve unresolved questions and downgrade status instead of inventing answers.
17. **Save and index.** Update the topic README metadata/history, run the index command, and suggest the next useful prerequisite or advanced topics. Complete when all generated learning files are Markdown and the central index resolves.

## Incremental update branch

For “go deeper,” “update,” “compare with,” or “add exercises” requests:

1. Read the complete relevant topic package and its update history.
2. Map the new request to existing coverage and sources.
3. Re-verify current facts for rapidly changing technologies; never reuse version-sensitive findings only because a URL was seen before.
4. Research and edit only the missing, stale, or contradicted areas unless a full refresh was requested.
5. Preserve valuable prior work, explain changed conclusions, add or update sources, update the `updated` date/history, validate, and re-index.

Reuse a prior source finding only when its URL, inspected version or commit, access date, answered question, and limitations are recorded and the claim is not freshness-sensitive.

## Review branch

For `review`, do not create a generic quiz. Read the existing package, extract its objectives, and conduct a progressive dialogue using conceptual explanation, failure scenarios, architecture choices, debugging, and implementation/source-path questions. Evaluate answers against the package and any freshly verified facts, explain gaps, then update `revision.md` with weak areas, targeted exercises, and sections to revisit. Do not write a final assessment before the learner has answered unless the user asks for a self-test worksheet only.

## Package status

- `draft`: scaffolded or materially incomplete.
- `researched`: evidence gathered and lesson written, but semantic validation remains.
- `validated`: deterministic checks pass and the agent has completed the semantic review.
- `needs-refresh`: important version-sensitive claims are stale or contradicted.

Never use `validated` to mean “all facts are guaranteed.” Record open questions and capability limitations in the package.
