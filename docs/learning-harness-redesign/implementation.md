# Implementation blueprint: Learning Harness Redesign

## Outcome

The redesigned harness should let a topic own many research modules, learning pages, labs, and assessments while preserving:

- Markdown research as the technical source of truth;
- stable topic identity across route and taxonomy changes;
- deterministic validation of structure, routes, evidence, and objectives;
- human semantic review for accuracy and pedagogy;
- local-first learner progress;
- safe orchestration by multiple agents.

This document is a design contract. The first implementation phase is now present in the worktree: `.agents/` owns the merged harness, shared contracts/parsers, multi-page validation, taxonomy registry, atomic mode-aware scaffolding, and read-only doctor/sync checks. Later manifest, objective-coverage, and migration phases remain design work rather than completed claims.

## Architecture at a glance

```text
User request
    ↓
Intent router
    ↓
Topic manager ───────────────→ topic manifest
    ↓                              ↓
Research planner             contract validation
    ↓                              ↓
Evidence workers ───────────→ research modules
    ↓                              ↓
Curriculum designer ────────→ objectives + concept DAG
    ↓                              ↓
Module authors + lab engineer     ↓
    ↓                         page/assessment plan
Publisher ─────────────────→ Astro routes and metadata
    ↓
Independent verifier
    ↓
Release gates + publication state
```

## 1. Separate the major intents

Replace the overloaded `mode` concept with independent fields.

```yaml
request:
  intent: explain | research | update | publish | review | practice | maintain
  depth: overview | standard | deep
  scope: concept | topic | system
  context: general | production | codebase
  delivery: chat | research-package | learning-experience
  writePolicy: none | draft | update | publish
```

### Router rules

| Request | Intent | Default write behavior |
| --- | --- | --- |
| “Explain MCP” | `explain` | No files |
| “Research and capture MCP” | `research` | Create/update research package |
| “Update MCP to the latest version” | `update` | Update affected research evidence/modules |
| “Publish my MCP research” | `publish` | Update presentation and coverage |
| “Quiz me on MCP” | `review` | Store review/progress artifacts only when requested |
| “Build the MCP deployment gateway lab” | `practice` | Create a lab in an explicitly approved location |
| “Audit whether MCP notes are stale” | `maintain` | Read-only unless remediation is requested |

`review` must be removed from the content-generation mode enum.

## 2. Introduce a canonical topic manifest

Keep human-readable content in `docs/`, but store machine-managed state outside that directory.

```text
harness/
  contracts/
    topic-manifest.schema.json
    page-manifest.schema.json
    taxonomy.schema.json
  registry/
    domains.yaml
    fields.yaml
    skills.yaml
    learning-paths.yaml
  state/
    model-context-protocol.json
```

Illustrative topic manifest:

```json
{
  "schemaVersion": 1,
  "topicId": "model-context-protocol",
  "title": "Model Context Protocol",
  "status": "published",
  "taxonomy": {
    "domainIds": ["ai-engineering"],
    "fieldIds": ["agent-integration", "distributed-protocols"],
    "skillIds": ["typescript", "api-design", "secure-integration"]
  },
  "prerequisiteTopicIds": ["json-rpc", "http-security"],
  "overviewRoute": "/ai-engineering/agent-integration/model-context-protocol/",
  "researchRoute": "/research/model-context-protocol/",
  "pages": [
    {
      "pageId": "overview",
      "kind": "overview",
      "route": "/ai-engineering/agent-integration/model-context-protocol/",
      "order": 0
    },
    {
      "pageId": "tool-call",
      "kind": "module",
      "route": "/ai-engineering/agent-integration/model-context-protocol/tool-call/",
      "order": 2
    }
  ],
  "freshness": {
    "class": "version-sensitive",
    "reviewAfter": "2027-01-21"
  }
}
```

The actual implementation may use YAML or another schema format. The requirement is one canonical, validated representation.

## 3. Define topic and page schemas separately

### Topic identity

```yaml
topicId: model-context-protocol
title: Model Context Protocol
researchSlug: model-context-protocol
domainIds: [ai-engineering]
fieldIds: [agent-integration, distributed-protocols]
skillIds: [typescript, api-design]
prerequisiteTopicIds: [json-rpc]
status: published
```

### Page identity

```yaml
topicId: model-context-protocol
pageId: tool-call
kind: module
level: visual-understanding
order: 2
objectiveIds:
  - mcp.trace-discovery-and-call
  - mcp.classify-failure-surface
researchRefs:
  - README.md#a-tool-call-end-to-end
  - implementation.md#minimal-example
questionIds:
  - mcp.tool-flow
  - mcp.invalid-input
```

Rules:

- `topicId` is shared by all pages in a topic.
- `pageId` is unique across the learning site.
- every topic has exactly one overview page;
- a topic may have any number of child pages;
- page routes are explicit or derived deterministically from the manifest;
- existing routes can be preserved with an alias/redirect map.

## 4. Build the taxonomy registry

### Domain

A broad durable knowledge area, such as Software Engineering or AI Engineering.

### Field

A curriculum partition inside a domain, such as Agent Integration or Distributed Systems.

### Learner skill

A capability being developed, such as API design, debugging, or TypeScript.

### Tool

A product or instrument such as Git, Docker, or Linux.

### Learning path

An ordered selection of topics and modules for a role or goal.

Domains and fields may define a primary navigation hierarchy. Skills, tools, and paths are many-to-many facets. Do not duplicate topic files for every skill.

## 5. Replace the fixed research package

A deep topic may use:

```text
docs/<topic>/
  README.md
  research/
    plan.md
    sources.md
    repositories.md
  modules/
    architecture.md
    tool-lifecycle.md
    transports-and-versions.md
    authorization-and-security.md
    production-reliability.md
  practice/
    exercises.md
    recall.md
  review/
    mastery.md
```

The scaffolder should select artifacts from a depth profile:

| Profile | Required artifacts |
| --- | --- |
| Quick | Overview, one mechanism, small source ledger, one recall check |
| Standard | Overview, 2–5 modules, sources, practice, review |
| Deep | Standard plus source study, labs, alternatives, transfer assessment |
| Production | Deep plus threat model, operations, failure injection, cost/reliability decisions |
| Codebase | Deep plus repository map, execution trace, tests, modification lab |

A depth profile must not force irrelevant empty sections.

## 6. Add a knowledge-modeling stage

Before prose generation, produce a machine-readable outline containing:

```yaml
concepts:
  - conceptId: mcp.json-rpc-boundary
    title: JSON-RPC application boundary
    prerequisiteConceptIds: []
    objectiveIds: [mcp.explain-boundary]
    evidenceRefs: [research/plan.md#core-questions]
    destinationPageId: foundations
    assessmentIds: [mcp.boundary-recall]
```

The algorithm should:

1. classify the subject and official structure;
2. write observable objectives;
3. extract concepts and prerequisite edges;
4. detect dependency cycles;
5. cluster concepts into modules;
6. assign pages and assessments;
7. reject orphan objectives and concepts;
8. estimate scope before authoring.

## 7. Change the visual cardinality rule

Replace:

```text
pages.length === 1
```

with:

```text
exactly one overview page
zero or more module/deep-dive/practice/review pages
unique pageId for every page
shared topicId for every page in the topic
all declared routes unique
```

Coverage rows may target multiple destination files for one source section.

## 8. Separate research integrity from learning coverage

### Research integrity map

Purpose: ensure no evidence section disappears silently.

```text
research section → source file/reason
```

### Learning coverage map

Purpose: ensure the learner receives the intended learning experience.

```text
objective → concept → evidence → page anchor → assessment/lab
```

A link to the original research route may preserve detail, but it should be labeled `LINK_ONLY`, not counted as an equivalent transformation. Link-only use should be bounded and justified.

## 9. Centralize schemas and parsers

The current repository has three independent frontmatter parsers. Replace them with:

- one YAML parser;
- one shared topic/page/taxonomy schema package;
- Astro Zod schemas generated from or aligned with the canonical contract;
- one route resolver;
- one heading-anchor implementation;
- `--json` output from validation CLIs.

A configuration key must be consumed by code or deleted. Add a config-honesty test.

## 10. Make scaffolding recoverable

Topic creation should:

1. render all files in memory;
2. validate the proposed manifest and path safety;
3. write into a temporary sibling directory;
4. atomically rename it into place;
5. update indexes and manifests transactionally;
6. leave a recoverable journal entry on failure.

Add read-only diagnostics:

```bash
node .agents/bin/deep-learn.mjs doctor
node .agents/bin/deep-learn.mjs sync --check
```

`doctor` should report:

- stale index entries;
- orphan learning pages;
- orphan coverage maps;
- missing research topics;
- duplicate IDs/routes;
- config keys without consumers;
- review artifacts that accidentally affect publication coverage.

## 11. Derive navigation and backlinks

The current research backlink is hardcoded for MCP. Replace it with a manifest or collection lookup:

```text
research topic ID → topic manifest → overview route
```

The homepage, category pages, sidebar, dashboard, and skill pages should be generated from the same registry rather than maintained independently.

Custom research routes also need explicit integration behavior for:

- view modes;
- site graph inclusion/exclusion;
- raw Markdown output;
- LLM text output;
- link validation;
- search and pagefind indexing.

## 12. Model learner evidence

Progress v2 should be local-first and versioned.

```json
{
  "schemaVersion": 2,
  "topics": {
    "model-context-protocol": {
      "objectives": {
        "mcp.trace-discovery-and-call": {
          "status": "practiced",
          "confidence": 3,
          "evidenceIds": ["question:mcp.tool-flow", "lab:typed-local-tool"],
          "nextReview": "2026-10-02"
        }
      }
    }
  }
}
```

Use one client-side storage module with:

- schema validation;
- migrations;
- storage error handling;
- export/import;
- stable topic/page/question IDs;
- optional answer or reflection storage;
- no claim of cross-device sync until such a service exists.

## 13. Add auditable semantic review

A semantic reviewer should record:

- reviewer role;
- date;
- repository commit;
- objectives reviewed;
- primary claims sampled;
- unresolved limitations;
- pass/fail per criterion.

A model should not be able to set `validated` merely by editing a frontmatter string. A transition command should derive status from deterministic and semantic gate results.

## 14. Add an aggregate release gate

Suggested command:

```bash
npm run check
```

It should run:

1. schema/config lint;
2. research validation;
3. multi-page visual validation;
4. orphan and route graph checks;
5. `astro check`;
6. unit tests;
7. production build;
8. browser/accessibility checks when available;
9. semantic-review presence for topics marked published.

CI should run on pull requests and freshness audits should run on a schedule for version-sensitive topics.

## 15. Use multiple agents only after contracts exist

Recommended ownership:

| Role | Owns | Must not do |
| --- | --- | --- |
| Manager | taxonomy, IDs, module plan, state transitions | delegate away structural decisions |
| Research planner | question and evidence plan | write final lesson prose |
| Source worker | source/claim analysis | alter topic scope |
| Curriculum designer | objectives, concept DAG, page/assessment plan | publish routes directly |
| Module author | one assigned research/learning module | rewrite unrelated modules |
| Lab engineer | executable practice and tests | change learner objectives |
| Publisher | Astro pages and route metadata | introduce new technical claims |
| Verifier | independent semantic and quality report | edit content it is reviewing |
| Maintainer | version drift and targeted updates | broad rewrite without impact analysis |

Parallelism begins only after the manager freezes IDs, dependencies, and write ownership.

## 16. Pilot strategy

Use two pilots:

- **MCP:** complex, version-sensitive, source-inspected, production-oriented;
- **Git merging branches:** small, legacy, visually complete, currently outside the managed topic model.

The MCP pilot should split the current 3,789-word page while preserving the overview URL and important anchors. The Git pilot should prove that a small existing page can adopt the same contract without being forced into a large structure.

## Acceptance criteria

- One-page and multi-page topics are both valid.
- Every topic has one overview and unique child-page IDs.
- Every objective maps to a page and an assessment or lab.
- New fields can be added through the registry without editing Astro config.
- No orphan research, presentation, coverage, or route state exists.
- Broken relative and root-relative links fail validation.
- `explain` requests create no files.
- Review requests do not scaffold new topic packages.
- Source status and page status are derived from gates.
- CI proves clean install, validation, type checking, and production build.
- Progress is exportable and migratable.
- The old MCP overview and research routes remain reachable.
- The two pilots demonstrate both small and large topic shapes.

## Recommended implementation order

1. Reconcile the current MCP deletion state.
2. Add shared schemas and a read-only doctor.
3. Introduce topic/page IDs and multi-page fixtures.
4. Add the taxonomy and topic manifest.
5. Add the concept/objective/page planner.
6. Replace the fixed research scaffolder with depth profiles.
7. Generalize research backlinks and custom-route integrations.
8. Pilot MCP and Git.
9. Add progress v2 and objective evidence.
10. Add CI, semantic-review records, and freshness automation.
