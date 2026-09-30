---
name: explain
description: "Answer a question in chat only. Creates no files and changes no repository state."
invocation: user
---

# Explain

Answer the question. Nothing else.

This skill exists because the most tempting path when a question arrives is to
scaffold a research package. That is almost always wrong: a normal question does
not need six files, a source ledger, and a coverage map.

## Rules

1. **Create no files.** Not notes, not scaffolds, not `learning.md`.
2. **Change no files.** Do not update an index, a `README.md`, or a frontmatter date.
3. **Answer in chat.** If the answer is long, structure it in the reply instead of on disk.
4. **Suggest persistence, do not perform it.** End with one line: what to say if the user wants this saved.
5. **Cite what you actually read.** If you opened a local file, name it. If you did not verify it externally, say so.

## When this is the wrong skill

| The user says | Use instead |
| --- | --- |
| "teach me", "research", "go deeper", "save this" | `deep-learn` |
| "publish", "make it visual", "add a lesson page" | `deep-learn-visual` |
| "review my learning", "what am I missing" | `review-learning` |
| "split this into pages" | `migrate-content` |
| "verify it", "check my work" | `verify-topic` |

## Done when

The question is answered and `git status --short` is unchanged.