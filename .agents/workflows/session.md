# Session lifecycle

How a session starts, proceeds, and ends. These are the clock-in and clock-out
routines; they exist so a new session reaches an executable state in under three
minutes instead of re-deriving everything from scratch.

## Clock in

1. Read `.agents/PROGRESS.md`. It holds the current state, the one item in
   flight, blockers, and the first command of the next session.
2. Run `node .agents/bin/harness.mjs status` for the doctor summary and VCR.
3. Run the `Next session starts` command from `PROGRESS.md` and confirm a green
   baseline before changing anything. A red baseline is not your fault and must
   not be silently absorbed.
4. Check `git status --short`. Never discard work you did not create. If files
   are deleted, ask whether the deletion was intentional.

## Select

Pick **exactly one** item from `.agents/features.json`:

- WIP = 1. Overreach and under-finishing are the same failure.
- Prefer a `blocked` item whose blocker has resolved.
- Never set `state: done` yourself. Only a passing verification may do that, and
  `doctor` rejects a `done` feature without recorded evidence.

## Execute

1. Route the work using the table in `AGENTS.md`. The last column says which
   skill owns the request.
2. Write only inside your skill's declared write scope.
3. Run the gate after each meaningful change, not once at the end:

   ```bash
   node .agents/bin/harness.mjs check --layer=static
   node .agents/bin/harness.mjs check --layer=runtime
   ```

4. Fix the first failing layer before doing anything else.

## Context pressure

If context runs low, do not rush to finish. Stop, update `PROGRESS.md`, and leave
a clean checkpoint. A rushed finish produces an unverified claim; a checkpoint
produces a resumable one.

## Clock out

1. Run the full gate: `node .agents/bin/harness.mjs check`.
2. Write a receipt for any topic you changed:
   `node .agents/bin/harness.mjs receipt <slug>`.
3. Update `.agents/features.json`: the state, the evidence, and any `blocked_by`.
4. Update `.agents/PROGRESS.md`: current state, what is now in flight, blockers,
   and the next session's first command.
5. Report in this shape:

```text
WHAT I DID
WHAT I CHANGED
FILES CHANGED
FILES DELIBERATELY UNTOUCHED
CHECKS RUN, WITH EXIT CODES
UNRESOLVED RISKS
NEXT BEST ACTION
```

Every claim cites a check that ran. A receipt is evidence; an assertion is not.

## Clean state

A session is complete only when all of these hold:

- the gate passes at all three layers
- the feature list has no feature marked done without evidence
- `doctor` reports no error
- no debug artifacts or scratch files are left behind
- `PROGRESS.md` describes the state a fresh session would find
- the worktree contains no unrelated modifications

Entropy is the default. Active cleanup is what counters it.