# Validation policy

A topic is complete only after both deterministic checks and an agent-driven semantic review. Structural automation cannot certify factual correctness.

## Deterministic gate

Run:

```bash
node scripts/deep-learn.mjs validate <topic-slug> --strict
node scripts/deep-learn.mjs index
node scripts/deep-learn.mjs validate --all --strict
```

The CLI checks what can be checked mechanically:

- core Markdown files exist
- topic metadata and directory slug agree
- only Markdown learning artifacts are stored under `docs/`
- local Markdown links resolve
- fenced code and Mermaid blocks are balanced
- topic titles/slugs are not duplicated
- the central index contains each topic
- unfinished template markers and draft status are rejected in strict mode
- completed source files contain URLs, recognized source types, and inspection statuses

## Semantic gate

The agent must review and record the outcome in the topic research plan or README:

1. **Research completeness:** map every objective and major question to a section, answer, or explicitly unresolved item.
2. **Source quality:** confirm authoritative evidence supports important claims and source records identify version/date/limitations.
3. **Technical accuracy:** re-check API names, parameters, configuration, deprecations, version boundaries, and examples against primary evidence.
4. **Source analysis:** verify repositories and cited paths at the recorded commit; ensure architecture/control-flow claims came from source rather than only the README.
5. **Implementation quality:** inspect completeness and usability; reproduce executable examples where safe and label every result honestly.
6. **Teaching quality:** ensure the mental model precedes internals, terminology is defined, mechanisms are demonstrated, and reading order is coherent.
7. **Production depth:** check applicable failure, scale, security, observability, deployment, performance, cost, and testing trade-offs.
8. **Document quality:** remove empty/repeated sections, verify citations near claims, explain diagrams, and confirm index/related-topic links.

## Completion decision

Set status to `validated` only when deterministic checks pass, semantic review is complete, and remaining gaps are explicitly documented without undermining the learning objectives. Otherwise keep `draft`/`researched` or use `needs-refresh`.

Validation reports facts, warnings, and unresolved questions. It never claims completeness merely because required filenames exist.
