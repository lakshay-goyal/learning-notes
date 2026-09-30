# Validation policy

A topic is complete only after both a deterministic gate and an agent-driven
semantic review. Structural automation cannot certify factual correctness.

## Layer 1: the deterministic gate

```bash
node .agents/bin/harness.mjs check
```

Three ordered layers. A later layer does not run while an earlier one fails,
because a structural failure makes runtime and build results untrustworthy.

| Layer | Proves |
| --- | --- |
| `static` | research and visual contracts hold |
| `runtime` | `npm test` passes |
| `system` | `doctor` is clean and the production build succeeds |

Narrow it while iterating:

```bash
node .agents/bin/harness.mjs check --layer=static
```

### What the static layer checks

- required research files exist for the mode, including `learning.md`
- topic metadata and directory slug agree
- `learning.md` declares objectives and a page plan with a matching `topicId`
- only Markdown learning artifacts live under `docs/`, except `review/*.html`
- local Markdown links resolve
- fenced code and Mermaid blocks are balanced
- topic titles are not duplicated
- the central index contains every topic
- template placeholders and `example.invalid` URLs are rejected in strict mode
- source entries carry a real URL, a justified type, and an inspection status
- a `validated` topic records a verified version, not `UNVERIFIED`
- one `overview` page per topic, unique `pageId`s, unique routes
- one `topicId` per topic, one research package per topic
- every page declares at least one objective and one assessment
- every objective resolves to an assessment; the ratio is reported
- every objective and concept a page names exists in `learning.md`
- every research level-two heading has a coverage row, or a recorded exclusion
- `MAPPED` rows point at a destination file and an anchor the build produces

### What it cannot check

- whether a technical claim is true
- whether a cited source says what the claim says
- whether an objective is genuinely taught rather than named
- whether a diagram is technically accurate
- whether the lesson is cognitively loadable
- whether an assessment would actually evidence its objective

## Layer 2: the semantic gate

The agent records the outcome in the topic's `research-plan.md` or `README.md`:

1. **Research completeness** — every objective and question maps to a section, an
   answer, or a recorded limitation.
2. **Source quality** — authoritative evidence supports important claims, and each
   source records its version, access date, and limitations.
3. **Technical accuracy** — API names, parameters, configuration, deprecations,
   version boundaries, and examples checked against primary evidence.
4. **Source analysis** — cited paths verified at the pinned revision; architecture
   and control-flow claims came from source, not a README.
5. **Implementation quality** — examples complete and runnable where claimed, with
   honest execution status.
6. **Teaching quality** — the mental model precedes internals, terminology is
   defined before use, mechanisms are demonstrated, reading order is coherent.
7. **Production depth** — applicable failure, scale, security, observability,
   deployment, performance, cost, and testing trade-offs are explained.
8. **Learning design** — every objective is taught and assessable; recall prompts
   sit next to what they test; the page split reduces cognitive load.
9. **Document quality** — no empty or repeated sections, citations adjacent to
   claims, diagrams explained, index and related-topic links resolve.

## Honesty is not a placeholder

`UNVERIFIED`, `NOT EXECUTED`, and `TESTED` are legal in strict validation. An
earlier rule rejected them, which punished an author for labelling a version they
could not confirm and pushed them into vague prose instead.

Version honesty is enforced where the claim lives: `requireVersionVerification`
rejects a `validated` topic whose `versions` frontmatter is still `UNVERIFIED`.

## Evidence, not assertion

```bash
node .agents/bin/harness.mjs receipt <slug>
```

writes `.agents/evidence/<slug>.json` with the commit, the commands, and their
exit codes. A completion claim cites a receipt. Independent review is a separate
write scope: `verify-topic` writes `.agents/reviews/` and never edits what it
verified.

## Completion decision

Set `validated` only when the deterministic gate passes, the semantic review is
complete, and remaining gaps are documented without undermining the objectives.
Otherwise stay `draft`, `researched`, or `needs-refresh`.

Validation reports facts, warnings, and unresolved questions. It never claims
completeness because required filenames exist.