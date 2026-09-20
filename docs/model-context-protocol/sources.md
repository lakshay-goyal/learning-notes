# Sources: Model Context Protocol

Accessed 2026-09-21. Each `ANALYZED` entry was opened and used; `SOURCE_INSPECTED` means the repository content was retrieved and its cited paths were checked at the recorded commit.

## Source 1 — [Model Context Protocol specification, revision 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28)

- Source type: `SPECIFICATION`
- Author or organization: Model Context Protocol project
- Publication date: `2026-07-28`
- Access date: `2026-09-21`
- Relevant version/revision: `2026-07-28`
- Inspection status: `ANALYZED`
- Important findings: MCP uses JSON-RPC between hosts/clients/servers; the modern base protocol uses stateless self-contained requests and per-request capability information; server features include tools, resources, and prompts; security principles require consent, data control, and caution around tool execution.
- Research questions answered: purpose, roles, primitives, base behavior, extensions boundary, trust and consent.
- Known limitations: overview-level source; detailed transports and authorization require their dedicated specification pages.

## Source 2 — [MCP transport specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)

- Source type: `SPECIFICATION`
- Author or organization: Model Context Protocol project
- Publication date: `2026-07-28`
- Access date: `2026-09-21`
- Relevant version/revision: `2026-07-28`
- Inspection status: `ANALYZED`
- Important findings: transports bind framing/delivery without changing semantics; standard bindings are newline-delimited stdio and POST/request-scoped-SSE Streamable HTTP; body metadata is authoritative; cancellation and legacy fallback are transport-defined.
- Research questions answered: stdio versus HTTP, message direction, metadata, cancellation, custom-transport obligations.
- Known limitations: does not select a deployment for a particular organization's threat or network model.

## Source 3 — [MCP authorization specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)

- Source type: `SPECIFICATION`
- Author or organization: Model Context Protocol project
- Publication date: `2026-07-28`
- Access date: `2026-09-21`
- Relevant version/revision: `2026-07-28`
- Inspection status: `ANALYZED`
- Important findings: HTTP authorization is optional but follows an OAuth profile when used; the MCP server is a resource server; protected-resource discovery, authorization-server discovery, audience/resource binding, bearer-header use, issuer validation, scope challenges, and registration choices have normative requirements; stdio should retrieve credentials from the environment instead.
- Research questions answered: auth roles, token transport/validation, scope escalation, stdio distinction, confused-deputy protection.
- Known limitations: the acceptance implementation did not reproduce a full OAuth flow; referenced OAuth standards remain authoritative for their own mechanisms.

## Source 4 — [The 2026-07-28 specification release](https://blog.modelcontextprotocol.io/posts/2026-07-28/)

- Source type: `RELEASE_NOTES`
- Author or organization: MCP Core Maintainers / Model Context Protocol project
- Publication date: `2026-07-28`
- Access date: `2026-09-21`
- Relevant version/revision: `2026-07-28`
- Inspection status: `ANALYZED`
- Important findings: final release introduced the stateless core, per-request metadata, optional `server/discover`, Multi Round-Trip Requests, header mirroring, cache hints, authorization hardening, extensions framework, and deprecations; Tier 1 SDKs supported the revision at release.
- Research questions answered: why the lifecycle changed, migration-relevant differences, high-level production motivation.
- Known limitations: maintainer announcement and partner quotations are first-party release evidence, not independent benchmarks or incident studies.

## Source 5 — [MCP TypeScript SDK v2 documentation](https://ts.sdk.modelcontextprotocol.io/v2/)

- Source type: `OFFICIAL_DOCUMENTATION`
- Author or organization: Model Context Protocol project
- Publication date: `UNKNOWN`
- Access date: `2026-09-21`
- Relevant version/revision: TypeScript SDK v2 / MCP `2026-07-28`
- Inspection status: `ANALYZED`
- Important findings: v2 is the stable split-package line; `@modelcontextprotocol/server` and `client` are distinct; `McpServer`, `registerTool`, `serveStdio`, and Standard Schema/Zod are the primary beginner path; Node.js, Bun, and Deno are supported.
- Research questions answered: package choices, public API, minimal server structure, runtime scope.
- Known limitations: documentation follows the stable line and may be updated after the pinned package/source revision.

## Source 6 — [Build your first MCP TypeScript server](https://ts.sdk.modelcontextprotocol.io/v2/get-started/first-server.html)

- Source type: `OFFICIAL_DOCUMENTATION`
- Author or organization: Model Context Protocol project
- Publication date: `UNKNOWN`
- Access date: `2026-09-21`
- Relevant version/revision: TypeScript SDK v2
- Inspection status: `ANALYZED`
- Important findings: Node.js 20+, ESM, server/tool registration, Zod validation, tool error results, stdio serving, stderr logging, and Inspector-based manual invocation.
- Research questions answered: dependencies, server API signature, execution behavior, common stdio failure.
- Known limitations: tutorial uses a weather example and does not constitute a production architecture.

## Source 7 — [Build your first MCP TypeScript client](https://ts.sdk.modelcontextprotocol.io/v2/get-started/first-client.html)

- Source type: `OFFICIAL_DOCUMENTATION`
- Author or organization: Model Context Protocol project
- Publication date: `UNKNOWN`
- Access date: `2026-09-21`
- Relevant version/revision: TypeScript SDK v2
- Inspection status: `ANALYZED`
- Important findings: client package and stdio transport setup, server process launch, discovery, invocation, and result handling.
- Research questions answered: minimal host-side protocol participant and client/server pairing.
- Known limitations: tutorial scope; model orchestration, auth, and deployment are intentionally absent.

## Source 8 — [Supporting protocol revision 2026-07-28 in the TypeScript SDK](https://ts.sdk.modelcontextprotocol.io/v2/migration/support-2026-07-28)

- Source type: `OFFICIAL_DOCUMENTATION`
- Author or organization: Model Context Protocol project
- Publication date: `UNKNOWN`
- Access date: `2026-09-21`
- Relevant version/revision: TypeScript SDK v2 / MCP `2026-07-28`
- Inspection status: `ANALYZED`
- Important findings: modern serving/negotiation is explicit; hand-constructed clients/servers retain legacy defaults; per-era codecs isolate wire behavior; request-state/MRTR, auth opt-ins, header mirroring, and public/wire type boundaries are migration concerns.
- Research questions answered: avoiding mixed versions, SDK behavior versus protocol revision, modern opt-in.
- Known limitations: migration reference is SDK-specific and assumes familiarity with v1/2025-era behavior.

## Source 9 — [Official TypeScript SDK source at commit 6032170](https://github.com/modelcontextprotocol/typescript-sdk/tree/60321700871029401a2e3bed8fdf4f02c9ec3331)

- Source type: `SOURCE_CODE`
- Author or organization: Model Context Protocol project and contributors
- Publication date: `2026-09-16` (commit timestamp)
- Access date: `2026-09-21`
- Relevant version/revision: packages at `2.0.0`; commit `60321700871029401a2e3bed8fdf4f02c9ec3331`
- Inspection status: `SOURCE_INSPECTED`
- Important findings: split client/server/core/middleware architecture; high-level primitive registries; explicit serving entrypoints; per-era wire codecs/registries; schema validation; extensive unit and conformance-oriented tests; runnable paired examples.
- Research questions answered: actual tool-call control/data flow, entry points, version isolation, error surfaces, test strategy, code-reading itinerary.
- Known limitations: inspected source is a moving main-branch snapshot rather than only the exact published package tarballs; OAuth, all primitives, extensions, and all adapters were not traced end to end.

## Source 10 — [TypeScript SDK roadmap](https://github.com/modelcontextprotocol/typescript-sdk/blob/60321700871029401a2e3bed8fdf4f02c9ec3331/ROADMAP.md)

- Source type: `MAINTAINER_COMMENT`
- Author or organization: Model Context Protocol TypeScript SDK maintainers
- Publication date: `UNKNOWN`
- Access date: `2026-09-21`
- Relevant version/revision: pinned commit `60321700871029401a2e3bed8fdf4f02c9ec3331`
- Inspection status: `SOURCE_INSPECTED`
- Important findings: v2 is the stable line for `2026-07-28`; v1.x continues bug/security maintenance for a limited post-v2 period; conformance tracks both 2025 and 2026 revisions; extensions are tracked separately.
- Research questions answered: current line, compatibility intent, maintenance/version distinction.
- Known limitations: roadmap describes maintainer intent and may change; it is not a compatibility guarantee beyond published releases and tests.
