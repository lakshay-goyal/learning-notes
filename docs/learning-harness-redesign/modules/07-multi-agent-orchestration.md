# Module 7 — Multi-agent orchestration

## Learning objective

After this module, you should be able to assign research, curriculum, authoring, publishing, verification, and maintenance work without creating conflicting edits or duplicated knowledge.

## The current opportunity

The repository already has agent skills for research, visual publishing, structure, recall, connection, and review. Superset or another orchestration layer can run these roles in parallel.

The missing prerequisite is a stable content contract. Multiple agents without a manifest become multiple authors with slightly different mental models.

## Roles and ownership

| Role | Owns | Does not own |
| --- | --- | --- |
| Manager | taxonomy, IDs, module plan, state | source prose |
| Research planner | questions, scope, evidence plan | final lesson structure |
| Source worker | source analysis and claims | topic identity |
| Curriculum designer | objectives, concepts, dependencies, assessments | app routes |
| Module author | one assigned module | unrelated modules |
| Lab engineer | executable practice and tests | learner objectives |
| Publisher | Astro presentation and route metadata | new technical claims |
| Verifier | independent quality report | editing reviewed content |
| Maintainer | version drift and updates | broad rewrite without impact analysis |

## The orchestration sequence

```text
1. Manager locks taxonomy and topic scope
2. Research planner creates the question/evidence map
3. Source workers analyze independent evidence areas
4. Curriculum designer creates the objective/concept/page map
5. Lab engineer creates bounded practice artifacts
6. Module authors write disjoint modules
7. Publisher maps approved modules to routes
8. Verifier checks claims, learning design, routes, and accessibility
9. Manager runs gates and transitions state
```

## Why the manager must own IDs

If two agents independently choose:

- `mcp-auth`
- `mcp-authorization`
- `model-context-protocol-security`

the graph becomes ambiguous. The manager should assign stable IDs before parallel work starts.

## Parallelism rules

Parallelize work that has disjoint ownership:

- source A versus source B;
- module A versus module B;
- two independent labs;
- one accessibility audit versus one content-fidelity audit.

Do not parallelize:

- two authors writing the same module;
- a publisher changing routes while an author changes the manifest;
- a verifier and author editing the same file;
- a research worker silently changing the topic scope.

## Handoff contract

Every worker should return:

```text
task ID
files read
files changed or explicitly none
IDs and routes used
evidence collected
uncertainties
checks run
recommended next task
```

A handoff should be structured data or a short envelope, not a vague chat summary.

## Conflict prevention

Use:

- one owner per path;
- dependency-aware scheduling;
- immutable IDs during a run;
- a manager merge step;
- independent verification;
- `sync --check` before publication.

## Failure recovery

If a worker fails:

1. preserve its completed evidence;
2. do not let it invent a new topic ID;
3. record the blocked task;
4. rerun only the bounded task;
5. validate the unchanged neighboring modules;
6. ask for a decision if the scope itself is wrong.

## Prompt protocol for each worker

```markdown
## Objective
One outcome.

## Context to read
Exact files and maximum context.

## Write ownership
Exact paths this worker may modify.

## Required output
Exact schema, IDs, and evidence.

## Prohibited actions
No unrelated edits, no new claims without sources, no route changes.

## Verification
Commands and expected results.
```

This is more useful than a long list of general personality instructions.

## Interactive orchestration scenario

Four workers are available:

- Source worker;
- Curriculum worker;
- Two module authors.

The topic manifest is not yet approved.

### Question

Should the workers start?

<details>
<summary>Answer</summary>

No. The manager must first approve the topic scope, taxonomy, stable IDs, module boundaries, write ownership, and evidence plan. Starting authors early creates rework and conflicting page structures.

</details>

## Checkpoint

<details>
<summary>What is the difference between orchestration and delegation?</summary>

**Answer:** Delegation gives a worker a task. Orchestration coordinates dependencies, ownership, state transitions, merge order, verification, and recovery. More workers without orchestration create more conflicting outputs.

</details>

## Takeaways

- Use multiple agents after the manifest exists.
- One owner per path and one manager for structural decisions.
- Parallelize independent work, not overlapping prose.
- Hand off structured evidence and uncertainties.
- Verify independently before state transition.
- Superset is suitable for the transport; the repository must own the contracts.

## Next

[Module 8 — Migration roadmap](08-migration-roadmap.md)
