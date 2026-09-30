# Module 8 — Migration roadmap and decision playbook

## Learning objective

After this module, you should be able to sequence the redesign so that existing content, routes, and user work remain safe while the new contract becomes testable.

## Phase 0 — Reconcile the current state

The current worktree had pre-existing MCP research deletions. Do not automatically restore or discard them.

Decide:

- are the files intentionally removed, archived, or temporarily unavailable?
- should the MCP index entry remain?
- should the visual page remain published without research?
- should the coverage map be archived or regenerated?

Add a read-only `doctor` command that reports stale index rows, orphan pages, missing research, and orphan coverage. Do not make a destructive repair the default.

## Phase 1 — Make the new contract legal

Before migrating prose:

1. define `topicId` and `pageId`;
2. define page roles;
3. allow one overview plus multiple pages;
4. add objective and assessment IDs;
5. add a multi-page fixture;
6. make strict validation pass for both one-page and multi-page topics.

Exit criterion:

```text
small-topic fixture passes
large-topic fixture passes
duplicate page ID fails
missing overview fails
orphan page fails
```

## Phase 2 — Add manifests and shared schemas

Create:

- taxonomy registry;
- topic manifest;
- page manifest;
- shared frontmatter parser;
- shared route resolver;
- config schemas;
- vocabulary source.

Exit criterion: adding a field or changing a label does not require editing multiple unrelated files.

## Phase 3 — Redesign research generation

Replace the mandatory flat package with depth profiles and module support.

Do not delete existing files during the first migration. Preserve them and add manifests/links so rollback is possible.

Exit criterion: quick, standard, deep, production, and codebase profiles generate materially different structures without irrelevant empty sections.

## Phase 4 — Generalize the published experience

- derive research backlinks from the catalog;
- add overview and child navigation;
- preserve old routes with redirects;
- integrate research routes with graph, view modes, raw Markdown, and LLM outputs;
- filter drafts and private research from production;
- run accessibility checks.

Exit criterion: a second topic can publish without editing topic-specific Astro code.

## Phase 5 — Pilot two topics

### MCP pilot

Split the current page into:

- overview;
- foundations;
- tool call;
- transports/security;
- production;
- source map;
- practice;
- review.

Preserve the existing overview URL and important research links.

### Git pilot

Migrate `tools/git/merging-branches.mdx` into a small managed topic or module with:

- objective;
- source/evidence;
- practice;
- progress;
- stable page ID.

The Git pilot should remain small. It tests that the new model does not force every topic into a large structure.

## Phase 6 — Add learner evidence and maintenance

- progress v2 adapter;
- objective-level state;
- optional answer/reflection capture;
- labs and transfer tasks;
- export/import;
- freshness metadata;
- scheduled review;
- semantic-review records.

## Phase 7 — Scale the content system

Only after the pilots prove the model should you:

- migrate legacy pages;
- add more domains;
- add more agents;
- add cloud sync;
- add adaptive scheduling;
- add AI tutor recommendations.

## Keep, change, kill playbook

### Keep

- research/presentation separation;
- source hierarchy and version discipline;
- incremental update preservation;
- deterministic plus semantic validation;
- local-first progress privacy;
- good diagram-selection rules.

### Change

- flat package → depth profile;
- one page → one overview plus pages;
- free category → taxonomy IDs;
- self-rating → evidence and confidence;
- hardcoded route → manifest lookup;
- manual status → derived transition.

### Kill or quarantine

- exact-one-page invariant;
- mandatory boilerplate for every mode;
- heading-to-anchor score presented as mastery;
- public authoring instructions in learner navigation;
- manually maintained dashboard artifacts;
- stale `dist/` as a source of truth;
- unused plugin surface;
- any workflow that creates files for a plain explanation.

## Risk register

| Risk | Early signal | Mitigation |
| --- | --- | --- |
| Route breakage | old anchor returns 404 | redirect/alias registry |
| Duplicate knowledge | two pages teach same objective | concept registry and merge check |
| False validation | files exist but objective is empty | semantic review and objective fixtures |
| Lost progress | browser state schema changes | versioned adapter and export/import |
| Stale research | version-sensitive claim ages | freshness metadata and scheduled review |
| Agent conflict | two workers edit same path | ownership table and manager merge |
| Plugin churn | clean install fails | compatibility CI and dependency budget |
| Privacy leak | draft research appears publicly | publication filter and build check |

## Decision gates

Do not move to the next phase until the current phase has:

- fixtures;
- deterministic checks;
- documented rollback;
- a clean or explicitly explained validation result;
- a named owner for unresolved decisions.

## Interactive roadmap exercise

Choose one change and write:

```text
Current failure:
New contract:
Files affected:
Migration fixture:
Rollback:
Owner:
Verification:
```

Start with “allow a topic to have three pages.” Do not start with “move every category into a new folder.”

## Checkpoint

<details>
<summary>What is the first safe production change?</summary>

**Answer:** Make multi-page topics legal in a test fixture and add a read-only doctor. It changes the contract without rewriting user content or routes.

</details>

## Takeaways

- Reconcile user work before automating repairs.
- Make the new shape testable before migrating content.
- Use two contrasting pilots.
- Preserve old routes and rollback paths.
- Scale agents and content only after the contract is proven.

## Completion checklist

- [ ] Current worktree decisions are explicit.
- [ ] Multi-page fixture passes.
- [ ] Topic/page manifests exist.
- [ ] Research and learning coverage are separate.
- [ ] Second topic needs no hardcoded route.
- [ ] MCP overview route remains stable.
- [ ] Git pilot remains small and usable.
- [ ] Progress can be exported and migrated.
- [ ] CI runs clean-install validation and build.
- [ ] Semantic review is recorded separately.

## Final reflection

If you can explain why the old one-page rule existed, why it should be removed, and what replaces it, you understand the redesign better than someone who merely adds more files.
