# Research plan: Model Context Protocol

## Scope

- Slug: `model-context-protocol`
- Mode: `deep`
- Classification: protocol, SDK/library, integration architecture, and source-code implementation
- Audience/perspective: senior TypeScript/Node.js engineer building AI and agentic systems
- Final status: `validated`

The acceptance study intentionally covers core architecture, modern lifecycle, primitives, transports, the production trust boundary, a tested tool example, and one serious SDK source trace. It does not claim exhaustive coverage of every extension or OAuth sub-flow.

## Practical outcomes

- Explain the host/client/server boundary and core primitives.
- Trace discovery and tool invocation through protocol and SDK layers.
- Build and test a TypeScript server/client pair.
- Avoid mixing stateful 2025-era examples with the stateless `2026-07-28` revision.
- Choose a transport and name the security/reliability work MCP leaves to the application.
- Navigate the official TypeScript SDK implementation at a pinned revision.

## Prerequisites and existing knowledge

- TypeScript, Node.js subprocesses, HTTP, JSON-RPC, JSON Schema, and basic OAuth
- No prior related topic package existed in `docs/` when this study began.

## Core questions

| Status | Priority | Question | Evidence used | Destination |
| --- | --- | --- | --- | --- |
| ANSWERED | High | What problem and interoperability boundary does MCP define? | Current specification | `README.md` |
| ANSWERED | High | What are host, client, server, tools, resources, and prompts? | Current specification and SDK docs | `README.md` |
| ANSWERED | High | How does a tool call move through a real SDK? | Pinned SDK source and tests | `README.md`, `repositories.md` |
| ANSWERED | High | What changed in `2026-07-28`? | Release notes, spec, migration guide | `README.md` |
| ANSWERED | High | How do stdio and Streamable HTTP differ? | Current transport specification | `README.md` |
| ANSWERED | High | What is the authorization and consent boundary? | Current spec and authorization profile | `README.md` |
| ANSWERED | Medium | Can a minimal TypeScript v2 server/client execute? | Isolated local execution | `implementation.md` |
| PARTIAL | Medium | How is MCP operated across multiple industries? | Official release evidence only | Limitations in `README.md` |
| PARTIAL | Medium | How do all Tier 1 SDK implementations differ internally? | TypeScript inspected; others excluded | Limitations in `README.md` |

## Implementation and production questions

- Which SDK entrypoints select modern versus legacy behavior?
- Where are tool schemas exposed and validated?
- How are tool-level errors distinct from protocol, transport, and ambiguous-side-effect failures?
- Which components can scale horizontally after protocol sessions are removed?
- What authentication, authorization, consent, isolation, retry, observability, and testing controls remain outside the core protocol?

## Alternatives

- Direct model-provider tool/function definitions
- Ordinary REST/OpenAPI integrations
- Bespoke plugin contracts
- Queue/workflow engines behind or instead of an MCP boundary

## Repository criteria and selection

The repository needed to be official, current for `2026-07-28`, implementation-complete, test-rich, accessible, and directly relevant to the preferred TypeScript environment. The official `modelcontextprotocol/typescript-sdk` monorepo met those criteria. A smaller candidate list was preferable to shallowly listing several language SDKs.

## Version-verification targets

- Current final specification: `2026-07-28`
- Previous stateful era endpoint: `2025-11-25`
- TypeScript SDK stable packages: `@modelcontextprotocol/server` and `@modelcontextprotocol/client` `2.0.0`
- Inspected source: commit `60321700871029401a2e3bed8fdf4f02c9ec3331`, committed 2026-09-16
- Explicit migration caveat: v2 availability does not make every manually constructed client/server modern by default

## Capability assessment

| Capability | Available | Use and result |
| --- | --- | --- |
| Web/official docs | Yes | Opened the current specification, transports, authorization, release, and SDK pages |
| GitHub/source retrieval | Yes | Shallow-cloned and inspected the official TypeScript SDK at a recorded commit |
| Shell/Git/filesystem | Yes | Verified repository tree, paths, commit, package versions, tests, and examples |
| Code execution | Yes | Installed pinned public packages in a temporary directory and ran a client/server assertion |

External pages and repository content were treated as research data. No retrieved installation script was executed, no credentials were accessed, and no application file was changed.

## Package produced

- `README.md`: main lesson, architecture, version boundary, production analysis, and navigation
- `implementation.md`: tested minimal example and realistic extension
- `repositories.md`: pinned repository map, execution trace, and reading itinerary
- `exercises.md`: three projects, debugging, architecture, and source-reading practice
- `revision.md`: progressive recall and engineering questions
- `sources.md`: analyzed evidence ledger

## Stop conditions and decision

Broadening stopped after primary sources answered all high-priority questions, the SDK path was traced at a pinned commit, the minimal example passed, and another introductory source would not materially change the objectives. Independent production case studies and other SDK internals remain visible limitations rather than fabricated completeness.

## Coverage and validation review

Every learning objective maps to the main lesson, implementation guide, or repository analysis. All cited local paths were observed in the inspected commit. The two partial questions do not undermine the stated acceptance scope and are recorded in the main lesson's limitations. Deterministic strict validation and semantic review were completed on 2026-09-21.
