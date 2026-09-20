# Revision guide: Model Context Protocol

Use these prompts for explanation and design practice. A real review should be interactive: answer aloud or in writing, then ask DeepLearn to evaluate the reasoning against this package and freshly verify any current-version claims.

## Level 1: mental model

1. What interoperability problem does MCP solve, and what problems does it deliberately not solve?
2. Distinguish host, client, server, and model. Which component should own consent and server isolation?
3. Explain tools, resources, and prompts using one application, without defining all three as “context.”
4. When is a direct in-process function simpler and better than MCP?

## Level 2: protocol mechanisms

1. Trace `tools/list` followed by `tools/call`. Where are schemas useful, and why are they not authorization?
2. Compare stdio and Streamable HTTP in framing, process ownership, deployment, and failure behavior.
3. Contrast tool-level errors, protocol/SDK errors, transport failures, and an ambiguous committed side effect.
4. Why must stdout remain clean for stdio servers?

## Level 3: version reasoning

1. Explain the lifecycle difference between the `2025-11-25` and `2026-07-28` eras.
2. How can a stateless protocol support a multi-step operation that needs state?
3. Why does installing TypeScript SDK v2 not automatically prove that a connection uses the modern era?
4. What replaces server-initiated requests in the modern protocol, and what client behavior does that require?

## Level 4: production scenarios

1. Your HTTP MCP server has three replicas. Which state can disappear from the protocol layer, which state still needs durable/shared storage, and what new failures remain?
2. A write tool times out after a downstream API accepted the request. Design the retry, idempotency, and status-reconciliation contract.
3. A bearer token is valid but minted for another resource server. What check is missing, and what attack can result?
4. A tool result contains prompt injection. Which component must contain it, and why can the server's schema not solve that problem?
5. Design metrics and traces that distinguish protocol rejection, authorization denial, tool/domain failure, and dependency timeout without leaking secrets.

## Level 5: architecture choice

Your team has a Next.js host, local developer tools, and a centrally operated customer-data integration.

- Choose stdio or HTTP for each server and justify process/network trust boundaries.
- Decide which operations should be tools versus resources.
- Define how the host decides what the model may see and call.
- State where authentication, record-level authorization, confirmation, rate limits, deadlines, and audit logs live.
- Explain when you would keep an existing REST endpoint behind an MCP adapter rather than rewrite the service.

## Level 6: implementation/source mastery

1. In the inspected SDK, where does `McpServer` validate tool input and output, and how does a thrown handler error reach the client?
2. Why does the repository separate high-level primitive registration, serving entrypoints, and per-era wire codecs?
3. What happens when a 2026-only method is absent from the modern/legacy registry for the active era?
4. Read `createMcpHandler.ts`: which security checks does it explicitly not perform?
5. Read the client `callTool()` path: what changes when the tool-definition cache is cold?

## Transfer challenge

Design an MCP server for Shopify automation that can read product status and schedule a price change. Produce:

- primitive choices and schemas;
- trust boundaries and authorization inputs that the model cannot forge;
- preview/confirmation/commit flow;
- idempotency and ambiguous-timeout behavior;
- audit and observability model;
- transport/deployment choice; and
- tests for cross-shop access, duplicate delivery, stale plan, and downstream API throttling.

There is no single correct topology. A strong answer makes the policy boundary and failure semantics explicit and does not claim that MCP itself supplies them.

## Self-assessment

- I can explain MCP without calling it an agent framework.
- I can trace a tool call through discovery, validation, execution, encoding, and client result handling.
- I can identify the protocol era from lifecycle behavior rather than package name.
- I can design idempotent, authorized, observable tool operations.
- I can find the relevant TypeScript SDK entrypoint, registry, codec, handler, client, and test files.

## Review record

No interactive learner review has been completed. The questions are grounded in the validated acceptance package, but strengths and weak areas require the learner's answers. After a review, append the date, demonstrated reasoning, misconceptions, focused exercises, and sections to revisit.
