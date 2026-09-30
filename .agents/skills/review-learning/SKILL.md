---
name: review-learning
description: "Audit one topic against official docs: covered, partial, missing, and next steps."
invocation: user
---

# Review Learning

Audit one topic against the official documentation and report what is covered,
what is thin, what is missing, and what to do next.

This skill is deliberately narrow. It answers "how much do I actually know about
X, and what should I do about it?" It does not teach, publish, or re-validate.

## Distinguish this from the rest of the harness

| Request | Skill |
| --- | --- |
| "how do I actually know what I know about X" | `review-learning` (this skill) |
| "quiz me on X" / "review my understanding interactively" | `deep-learn` in `review` mode, writing `revision.md` |
| "publish X as a lesson" | `deep-learn-visual` |
| "verify what is already published" | `verify-topic` |

**Write ownership: `docs/<slug>/review/` only.** Never touch the topic's
`README.md`, status, `updated` date, `learning.md`, or the central index. A review
observes a package; it does not re-publish one.

## Method

Read [references/review-method.md](references/review-method.md) for the coverage
checklist, the rating rubric, and the evidence rules. In short:

1. Resolve the request to exactly one `docs/<slug>/` package. If there is no match,
   say so, list the closest slugs, and stop. Do not invent a review.
2. Read every Markdown file in that package.
3. Read the local evidence first: `implementation.md` for tested examples,
   `exercises.md` for completed versus untouched work, `repositories.md` for
   pinned source.
4. Then inspect the external sources the notes already cite: repos, blogs, papers.
   Never ask the user for a URL the notes already contain.
5. Compare against the official documentation for the version the package records.
6. Rate each checklist item `covered`, `partial`, `missing`, or `stale`.

Record every capability limit. No web access means no official-docs comparison.
An uninspected source is recorded as uninspected, never summarized from memory.

## Output

Write both files from [templates/](templates/), rendered with the real findings:

- `docs/<slug>/review/review.md` — the durable record: scope, method, limitations,
  coverage table, project analysis, strengths, gaps by impact, ecosystem
  recommendations, prioritized next steps.
- `docs/<slug>/review/insight.html` — a self-contained visual companion with no
  external requests.

Rules for `review.md`: cite local evidence with relative links, cite official
references with full HTTPS URLs, and verify every relative link exists.

`review/` is excluded from coverage validation, so writing these files cannot
invalidate the topic's coverage map.

## Finish

```bash
node .agents/bin/deep-learn.mjs validate <slug>
```

Then report, grounded in the two files: what was reviewed, what is solid, what is
thin, the top gaps by learning impact, the ecosystem picks mapped to the gaps they
close, and the concrete next exercise.

## Done when

Both files exist under `docs/<slug>/review/`, every rating cites a file or a URL,
and the validator passes.