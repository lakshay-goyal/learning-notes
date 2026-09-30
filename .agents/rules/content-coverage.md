# Research coverage rules

Before authoring, read every Markdown file in the topic research directory. Build `.agents/coverage/<slug>.md` with one row for every level-two source heading.

## What is a coverage source

Every Markdown file under `docs/<slug>/` **except**:

- `learning.md` — the planning contract, not teaching content
- anything under `review/` — review output, rewritten on every review

Excluding `review/` is what stops a completed review from demanding coverage rows
for its own headings and breaking the map it just audited. Excluding
`learning.md` stops every published topic from failing on `## Objectives`.

Each row records:

- source file and heading;
- destination learning file and anchor;
- `MAPPED` or `INTENTIONALLY_EXCLUDED`;
- a short transformation or exclusion note.

Mapping does not require copying paragraphs. It requires that each important definition, mechanism, implementation result, failure, alternative, repository finding, exercise family, source record, limitation, and personal observation remains recoverable.

An exclusion is valid only when it is outside the stated learning objective, duplicated without new information, or purely workflow metadata. Record the reason. Never use exclusion to conceal uncertainty or inconvenient detail.
