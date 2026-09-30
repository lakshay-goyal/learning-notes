# Audit the knowledge base

Run the ordered gate across every topic, then review what the gate cannot check.

```bash
node .agents/bin/harness.mjs check
node .agents/bin/harness.mjs features
```

## Mechanical

The gate already covers structure. Confirm:

- topic IDs and routes are unique and stable
- every published topic has a `learning.md`, and every `learning.md` has pages
- research-only topics are intentional, not forgotten
- `doctor` reports no orphan page, coverage map, or feature that lacks evidence
- acknowledged exceptions still exist and are not past their review date

## Learning quality

Read the pages. The gate cannot see any of this:

- quick recall reconstructs the definition, problem, mental model, takeaways, and
  use condition in about 30 seconds
- visual understanding explains the mechanism in about five minutes
- complete understanding keeps implementation, failure, production, source, and
  limitation access reachable from research
- active recall hides answers and tests topic-specific reasoning
- every objective is genuinely taught, not merely named on a page
- every assessment would actually evidence its objective
- recall prompts sit next to what they test rather than in one block at the end
- relationships use stable IDs and real routes, and each one is explainable
- progress shows honest empty states and never claims synchronization

## Report

Record unresolved issues rather than passing them through optimistic wording. For
each finding, name the gate that should have caught it, so the gap is closed once
rather than re-reported each audit.