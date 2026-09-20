# Implementing Model Context Protocol

## Version and execution status

- Protocol target: `2026-07-28`, negotiated with TypeScript SDK v2 auto mode
- Dependencies tested: `@modelcontextprotocol/server@2.0.0`, `@modelcontextprotocol/client@2.0.0`, `zod@4.6.5`, `tsx@4.20.5`
- Runtime tested: Node.js `26.8.1`, npm `11.19.0`
- Execution status: `TESTED` on 2026-09-21 in an isolated temporary directory
- Result: dependency audit reported zero vulnerabilities; the client discovered `add`, called it, and asserted `{ sum: 42 }`
- Observation: Node emitted a `module.register()` deprecation warning from the TypeScript runner. It did not affect the MCP exchange; use your normal TypeScript build/runtime path in production.

The API shape follows the official v2 server/client tutorials. The SDK requires Node.js 20 or later and publishes ES modules. ([server tutorial](https://ts.sdk.modelcontextprotocol.io/v2/get-started/first-server.html), [client tutorial](https://ts.sdk.modelcontextprotocol.io/v2/get-started/first-client.html))

## Minimal example: one local tool

### Purpose

This example isolates the protocol mechanism: a client launches a server over stdio, discovers a typed tool, invokes it, validates the structured result, and closes the connection. It deliberately has no model loop—the client plays the host-side role directly.

### Files and dependencies

#### `package.json`

```json
{
  "name": "mcp-v2-minimal-test",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "tsx client.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/client": "2.0.0",
    "@modelcontextprotocol/server": "2.0.0",
    "tsx": "4.20.5",
    "zod": "4.6.5"
  }
}
```

#### `server.ts`

```ts
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

serveStdio(() => {
  const server = new McpServer({
    name: 'math-learning-server',
    version: '1.0.0',
  });

  server.registerTool(
    'add',
    {
      description: 'Add two numbers',
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      outputSchema: z.object({ sum: z.number() }),
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ a, b }) => ({
      content: [{ type: 'text', text: String(a + b) }],
      structuredContent: { sum: a + b },
    }),
  );

  return server;
});
```

`registerTool` gives clients a discoverable JSON Schema and gives the handler validated, inferred arguments. Returning both text and `structuredContent` serves two consumers: a model can read the text, while host code can use the typed JSON value. The annotations are hints for clients, not a security policy.

#### `client.ts`

```ts
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const client = new Client(
  { name: 'math-learning-client', version: '1.0.0' },
  { versionNegotiation: { mode: 'auto' } },
);

await client.connect(
  new StdioClientTransport({
    command: 'npx',
    args: ['-y', 'tsx', 'server.ts'],
  }),
);

const listed = await client.listTools();
assert.deepEqual(listed.tools.map((tool) => tool.name), ['add']);

const result = await client.callTool({
  name: 'add',
  arguments: { a: 20, b: 22 },
});
assert.deepEqual(result.structuredContent, { sum: 42 });

console.log(
  `PASS: add returned ${(result.structuredContent as { sum: number }).sum}`,
);

await client.close();
```

`versionNegotiation: { mode: 'auto' }` probes for the modern protocol and can fall back to a legacy peer. That option is intentional: the v2 migration guide says a hand-constructed client otherwise retains the legacy handshake behavior. ([protocol-version guide](https://ts.sdk.modelcontextprotocol.io/v2/protocol-versions))

### Setup and run

Use a fresh directory outside this knowledge base:

```bash
npm install --ignore-scripts
npm test
```

Expected final output:

```text
PASS: add returned 42
```

The server should not write logs with `console.log`: stdout carries stdio protocol frames. Use stderr (`console.error`) for diagnostics. ([official server tutorial](https://ts.sdk.modelcontextprotocol.io/v2/get-started/first-server.html))

### What to test next

- Pass a string for `a` and verify schema validation rejects the call before the handler runs.
- Throw inside the handler and inspect the tool-level error result.
- Kill the server process during a call and distinguish the transport failure.
- Add a non-idempotent tool and require an idempotency key before allowing retries.

## Real application example: research-note retrieval

Execution status: `NOT EXECUTED` because this is an architecture extension, not a complete storage application.

Suppose a Next.js AI workspace needs to search private engineering notes. Expose a narrow read-only `search_notes` tool rather than giving the model raw database access:

```ts
server.registerTool(
  'search_notes',
  {
    description: 'Search notes visible to the authenticated workspace member',
    inputSchema: z.object({
      query: z.string().min(2).max(300),
      limit: z.number().int().min(1).max(20).default(5),
    }),
    outputSchema: z.object({
      hits: z.array(
        z.object({ id: z.string(), title: z.string(), excerpt: z.string() }),
      ),
    }),
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  async ({ query, limit }, context) => {
    // Educational seam: derive the principal from verified server-side auth
    // context. Never accept a user/workspace id supplied only by the model.
    const principal = requireVerifiedPrincipal(context);
    const hits = await notes.search({
      workspaceId: principal.workspaceId,
      query,
      limit,
      signal: AbortSignal.timeout(2_000),
    });

    const safeHits = hits.map(({ id, title, excerpt }) => ({ id, title, excerpt }));
    return {
      content: [{ type: 'text', text: JSON.stringify(safeHits) }],
      structuredContent: { hits: safeHits },
    };
  },
);
```

`requireVerifiedPrincipal` and `notes.search` are application interfaces, not SDK APIs. The important design is the boundary: identity is derived from verified server context; tenant scope cannot be chosen by tool arguments; limits and deadlines are enforced server-side; only an allow-listed result shape leaves the service.

### Host flow

1. The host connects to the note server and caches the discovered schema within advertised freshness rules.
2. The host decides whether this trusted server and tool may be offered to the model.
3. A tool call carries the query, not a tenant identity or access token selected by the model.
4. The server authenticates the request, derives the workspace, authorizes note access, applies limits, and queries storage.
5. The host treats returned note text as untrusted content: it may contain prompt-injection instructions and must not override host policy.

## Production-oriented extension

Move to Streamable HTTP when the server is independently deployed. Keep a fresh server factory per request with the v2 `createMcpHandler` entrypoint, and put verified authentication, origin/host checks, rate limits, request-size limits, and tracing ahead of it. The inspected source explicitly states that `createMcpHandler` does not perform token verification or origin/host validation by itself. ([pinned handler source](https://github.com/modelcontextprotocol/typescript-sdk/blob/60321700871029401a2e3bed8fdf4f02c9ec3331/packages/server/src/server/createMcpHandler.ts))

For write tools:

- require a stable idempotency key and store the operation result;
- separate “validate/preview” from “commit” for high-impact actions;
- require user confirmation in the host immediately before commit;
- attach deadlines but do not assume a timeout means no side effect occurred;
- return an operation ID so the client can query ambiguous outcomes; and
- log authorization decision, tool name, principal, idempotency key hash, duration, outcome, and trace ID without logging secrets.

## Common errors

| Symptom | Likely cause | Correction |
| --- | --- | --- |
| JSON parsing/framing errors on stdio | Application logs were written to stdout | Send diagnostics to stderr only |
| Modern features are missing despite v2 packages | Client/server stayed in the legacy era | Use the documented v2 serving entrypoints and explicit negotiation |
| Tool handler never runs | Input failed declared schema validation | Inspect arguments and return a precise schema/description |
| Retried write happens twice | Retry crossed an ambiguous commit boundary | Add idempotency and operation-status lookup |
| HTTP endpoint accepts an authenticated token for the wrong service | Audience/resource validation is missing | Validate token issuer, audience/resource, expiry, and scopes |
| Model follows instructions inside a resource | Host treated external content as policy | Preserve instruction hierarchy and isolate untrusted content |

## Potential improvements

- Replace the `npx` child command with a built artifact and pinned executable path.
- Add integration tests for invalid input, handler errors, process exit, deadlines, and cancellation.
- Add HTTP contract tests for auth discovery, 401/403 scope challenges, and audience rejection.
- Add trace propagation and per-tool latency/error metrics.
- Run the official conformance suite for a custom low-level implementation.

## Execution record

The example was created in a temporary directory, installed with `npm install --ignore-scripts`, and run with `npm test` on 2026-09-21. The first run used an older Zod and produced an SDK fallback warning; the dependency was corrected to `zod@4.6.5`, then the example passed with `PASS: add returned 42`. No example project was added under `docs/`.
