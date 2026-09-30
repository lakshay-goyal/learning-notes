# Research plan: Learning Harness Redesign

## Scope

- Slug: `learning-harness-redesign`
- Mode: `deep`
- Classification: learning architecture, content system, agent harness, Astro/Starlight application, developer platform
- Audience: a senior developer learning complex software and AI topics through an AI-assisted workflow
- Snapshot: repository commit `4d181b8`, plus the working-tree state observed on 2026-09-25
- Non-goal: implementing the harness, Astro components, or validators in this research package

## Practical outcomes

After using this package, the learner should be able to:

- distinguish content governance from a learning system;
- explain why the current one-page invariant blocks scalable topic design;
- design a domain/field/skill/topic/module/page information architecture;
- convert research headings into objectives, concepts, evidence, and assessments;
- define machine-readable contracts for topics and pages;
- route explain, research, publish, review, practice, and maintenance intents safely;
- design a multi-agent workflow with non-overlapping write ownership;
- prioritize a migration that preserves existing routes and user work;
- identify which current harness ideas should be kept, changed, or removed.

## Existing knowledge and prerequisites

The learner should already understand:

- Markdown and YAML frontmatter;
- basic JavaScript/TypeScript package and CLI structure;
- file and directory organization;
- content collections and static route generation at a conceptual level;
- the difference between tests, validations, and semantic review.

No prior knowledge of Superset orchestration is required.

## Core questions

| Status | Priority | Question | Evidence used | Destination |
| --- | --- | --- | --- | --- |
| ANSWERED | High | What actually forces flat research folders? | `scripts/deep-learn.mjs`, `.doty/config.json`, templates | Module 01 |
| ANSWERED | High | What actually forces one visual page? | `scripts/deep-learn-visual.mjs`, schema, MCP page, coverage map | Modules 01 and 03 |
| ANSWERED | High | Which parts of the existing architecture are worth preserving? | Research policy, update policy, validators, local-progress disclosure | README and Module 08 |
| ANSWERED | High | What should the target content ontology be? | Repository taxonomy, Astro schema, route constraints | Module 02 |
| ANSWERED | High | How should objectives, concepts, pages, labs, and assessments relate? | Learning methodology, audit findings, official Astro content model guidance | Modules 03 and 04 |
| ANSWERED | High | Which contracts must become machine-readable? | Three parsers, config files, validators, coverage map | Module 05 |
| ANSWERED | High | How should agents collaborate without duplicating or overwriting work? | Skill routing, current permissions, multi-role audit | Module 07 |
| ANSWERED | Medium | What should the Astro site and progress model do? | Dynamic research route, content schema, learning components | Module 06 |
| ANSWERED | Medium | What migration minimizes broken routes and lost work? | Current MCP routes, legacy pages, route generation | Module 08 |
| PARTIAL | Medium | How should semantic review be scored automatically? | Prose rubric and current validators | Module 05; human calibration remains required |
| PARTIAL | Low | Should progress synchronize across devices? | Current privacy contract | Module 06; local export/import is recommended before any sync decision |

## Architecture questions

### Content and curriculum

- What is a topic, module, page, concept, objective, lab, and assessment?
- When should content remain on one page?
- Which taxonomy dimensions are hierarchical and which are many-to-many?
- How can source coverage and learning coverage be measured separately?
- How should active recall be interleaved without creating repetitive quizzes?
- How should a topic be scoped when it grows beyond a reasonable learning unit?

### Harness and state

- Which data is canonical: README frontmatter, a topic manifest, or a content collection?
- How should research, publication, assessment, and freshness states be separated?
- Which transitions should be commands rather than manually edited strings?
- How can scaffolding be atomic, idempotent, and recoverable?
- How should agents receive only the context relevant to their stage?

### Astro application

- How should stable IDs survive taxonomy changes?
- How should topic overviews and child pages share navigation?
- How should research pages link back to learning pages without hardcoded topics?
- Which custom routes require explicit integration support for graph, view modes, raw Markdown, and LLM outputs?
- How should local progress be versioned and migrated?

## Evidence plan

Local repository evidence is primary for claims about this repository:

- root instructions and README files;
- `.doty/` research methodology;
- `.agent/` visual methodology;
- `.agents/` adapters and commands;
- both validation CLIs and their tests;
- Astro configuration and content schemas;
- dynamic research routing;
- learning components and progress storage;
- current published content and coverage map;
- Git history and working-tree state.

Official documentation is used only for framework behavior:

- Astro content collections and schemas;
- Astro routing, rest parameters, generated routes, and redirects;
- Starlight Markdown, headings, asides, and native `<details>` disclosures.

## Version and compatibility targets

- Repository snapshot: `4d181b8`
- Audit date: 2026-09-25
- Astro package family: 7.x as installed in `package-lock.json`
- Starlight package family: 0.42.x as installed
- The target design deliberately avoids relying on plugin-specific generated routes for core research navigation.

## Capability assessment

| Capability | Available | Planned use |
| --- | --- | --- |
| Local repository reads | Yes | Primary architecture and content evidence |
| Git history and `git show` | Yes | Inspect deleted MCP package without restoring it |
| Official web documentation | Yes | Verify Astro and Starlight behavior |
| Deterministic validators | Yes | Validate the new research package |
| Browser interaction testing | Not required | The package proposes future browser gates but does not claim they ran |
| Application implementation | Intentionally excluded | Requires a separate user request after this design is accepted |

## Planned package

- `README.md`: concise interactive start page and learning paths
- `modules/`: focused lessons that prevent one-page overload
- `implementation.md`: target schemas, commands, state transitions, and gates
- `exercises.md`: scenario-based workshop
- `revision.md`: progressive retrieval guide
- `repositories.md`: inspected repository map
- `sources.md`: evidence ledger

## Stop conditions

Research stops when:

- every high-priority architecture question is answered or explicitly bounded;
- repository claims have path-level evidence;
- framework claims are checked against official documentation;
- the target model can be represented in a machine-readable contract;
- the migration has acceptance criteria and rollback-safe phases;
- additional plugins or cloud features would not change the core recommendation.

## Coverage and validation review

Every learning objective maps to at least one module and one exercise or retrieval question. Framework-specific claims are linked to official documentation. Repository-specific claims cite the inspected snapshot. The package does not claim that the proposed code has been implemented or that current semantic validation is fully automatable.
