# Learning experience rules

Every substantial topic supports four access levels, proportionate to the subject.

## The four levels

1. **Quick recall** — definition, problem, mental model, three takeaways, and use
   conditions. Reconstructible in about 30 seconds.
2. **Visual understanding** — architecture or control flow, ordered mechanism,
   annotated example, relationships, trade-offs. About five minutes.
3. **Complete understanding** — implementation, internals, failures, security,
   production concerns, alternatives, inspected repositories, primary references.
4. **Active recall** — questions requiring retrieval, prediction, debugging,
   application, architecture, or trade-off reasoning before an answer is revealed.

Level 1 belongs on the overview. Level 4 belongs on practice and review pages.
Levels 2 and 3 belong on modules and deep dives.

## Progressive disclosure

Reduce visible cognitive load with hierarchy and disclosure; never delete
knowledge. The default scan path stays short while the full research remains
reachable through deep dives and `/research/<slug>/` routes.

## Multi-page by default

A topic publishes one `overview` plus focused child pages. Split by **learning
job**, not by section length:

| Page kind | Answers |
| --- | --- |
| `overview` | What is this, why it matters, when should I use it? |
| `module` | How does mechanism X work, step by step? |
| `deep-dive` | What are the internals, the source layout, the edge cases? |
| `practice` | How do I build or configure it? |
| `review` | Can I retrieve and apply this without looking? |

A topic that ships as one oversized page is a defect, not a simplification. Small
topics stay small: `quick` mode plans fewer pages, and
`pagePlanning.minimumPageCount` is a floor, not a target to inflate toward.

## Teaching order

1. Define terminology before relying on it.
2. Give the mental model before internals.
3. Explain a visual immediately before or after it, not in a distant caption.
4. Never repeat the same definition across overview, module, and review.
5. Give every page one next step.
6. No empty sections. If a section has nothing to say, delete it rather than
   filling it.

## Vocabulary

Shared terms come from `.agents/GLOSSARY.md`. A **research module** is a chapter;
a **module page** is a page whose `learning.kind` is `module`. They are never the
same thing.