---
name: verify-topic
description: "Independently verify a published topic read-only and record per-objective verdicts."
invocation: user
---

# Verify Topic

Check someone else's work, or your own from a separate context. Do not fix what
you find.

Self-evaluation is systematically too positive: the same model that wrote a page
tends to read it generously. The fix is not better instructions, it is a
different context with no stake in the verdict.

## Write ownership

**You may write exactly one file:** `.agents/reviews/<slug>-<YYYY-MM-DD>.md`

**You may not write** anything under `docs/`, `src/content/docs/`, or
`.agents/coverage/`. A verifier that edits the material it verifies is not a
verifier.

## Method

1. Read `.agents/PROGRESS.md` and `.agents/features.json` for context.
2. Run `node .agents/bin/harness.mjs receipt <slug>` and record the result.
3. Read the research package: `docs/<slug>/README.md`, `learning.md`,
   `sources.md`, and the implementation and exercise files when present.
4. Read every published page for the topic. Read `.agents/coverage/<slug>.md`.
5. For each objective in `learning.md`, judge separately:
   - **taught** — is there a page that explains it, not merely names it?
   - **assessed** — is there something the learner must do or answer?
   - **evidence-backed** — does the claim trace to a cited source?
6. Check the failure model: does the material say what breaks and where it surfaces?
7. Check the version boundary: does the page state which version it describes?

## Verdicts

Use only these:

| Verdict | Meaning |
| --- | --- |
| `sound` | Explained, evidenced, and correct against the cited sources |
| `thin` | Present but shallower than the objective implies |
| `unsupported` | Asserted without a source that was actually inspected |
| `contradicted` | Conflicts with a cited source or the recorded version |
| `missing` | Objective declared, nothing teaches it |

## Record

Write `.agents/reviews/<slug>-<date>.md`:

```markdown
# Verification: <topic> — <date>

- Receipt: `.agents/evidence/<slug>.json` at `<commit>`
- Validator results: <commands and exit codes>
- Limitations: what could not be inspected, and why

## Objective verdicts

| Objective | Taught | Assessed | Evidence | Verdict | Note |
| --- | --- | --- | --- | --- | --- |

## Findings, most severe first

1. <finding> — <what is wrong> — <what would fix it>

## Not verified

<anything deliberately left unchecked, stated plainly>
```

## Rules

- Never edit the content under review. Report instead.
- Never soften a verdict because the author tried hard.
- State plainly anything you could not verify. An unverified claim is not a sound one.
- A passing build is not a passing review. `npm run build` proves structure, nothing else.

## Done when

`.agents/reviews/<slug>-<date>.md` exists, every declared objective has a verdict,
and the receipt command was run and its result recorded.