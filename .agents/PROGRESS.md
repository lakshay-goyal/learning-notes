# Progress

updated 2026-10-01

<!--
  The resume pointer for any agent or human starting a session.

  Rules:
  1. Update it as the FIRST action after any successful gate, and the LAST action
     before ending work.
  2. Never restate what a command can already print. Record only what a machine
     cannot see.
  3. Reference artifacts by path. Never inline their content.
  4. At most ONE item in flight.
-->

## Current state

The audit in `HARNESS-AUDIT.md` is implemented. Every finding it listed as
enforced is now a check that runs:

- config keys are consumed, and the config-consumer scan no longer counts archived
  history as a consumer
- honest execution labels are legal in strict validation; version honesty is
  enforced on the `versions` field
- `review/` is excluded from coverage validation, so a review cannot break a map
- one browser progress store, keyed to config, with no mastery claim
- an ordered three-layer gate, a feature list with VCR, and a receipt writer
- multi-page planning at scaffold time via `docs/<slug>/learning.md`
- objective/assessment coverage as a real check
- skill routing with an explicit invocation axis and a router table
- CI running every gate

`learning-harness-redesign` is now published as eight pages — one overview plus
seven focused pages — with a 218-row coverage map and objective coverage 5/5. It is
the pilot proving the multi-page contract works on real content.

## In flight

Nothing. The next action is a decision, not a task.

## Blocked

- **`docs/model-context-protocol/` is deleted and must not be restored** without
  explicit confirmation (`prompt.md:29`). Its published learning page and 15KB
  coverage map are preserved rather than deleted, and both are recorded in
  `.agents/state/exceptions.json` until 2026-11-01. Resolve by restoring the
  research package or by approving deletion of the two dependents.
- **`migrate-mcp-to-multiple-pages`** is blocked on that same decision. The MCP
  page predates the multi-page contract and still uses the legacy single-page
  shape, but splitting it would discard source-backed content whose research
  package is absent.

## Next session starts

```bash
cat .agents/PROGRESS.md
node .agents/bin/harness.mjs status
```

Then ask the user which way the MCP research package goes. Everything else is green.

## Last green baseline

| Check | Result |
| --- | --- |
| `node .agents/bin/harness.mjs check` | all three layers pass |
| `npm test` | 72 pass, 0 fail |
| `node .agents/bin/deep-learn.mjs doctor` | no errors, 0 warnings |
| `npm run build` | 63 pages |
| `deep-learn-visual validate --all --strict` | 1 topic, 218 sections, 218 rows, objective coverage 5/5 |

Recorded against the enforcement work in this session, on top of commit `42b3f13`.