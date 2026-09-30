# Publish learning

For a validated research topic with no published pages yet.

## Order

1. `node .agents/bin/deep-learn-visual.mjs inspect <slug>`. It reports the
   objectives, planned page count, published pages, and objective coverage.
2. Read `.agents/config.json` and `docs/<slug>/learning.md`.
3. Use `structure-knowledge` if the learning design needs amending. Amend the
   design before authoring pages, not after.
4. Create the coverage map before drafting. Update it as anchors settle.
5. Create the pages in `learning.md`'s order. Each declares its `objectiveIds`,
   `assessmentIds`, taxonomy IDs, and access level.
6. Use `visualize-concept` only for questions a visual actually answers.
7. Use `generate-recall` for answer-hidden, objective-linked practice, and
   `connect-knowledge` for relationships whose routes exist.

## Completion

A useful end-to-end topic, not a scaffold:

- one overview plus the planned child pages
- every objective taught and assessed somewhere in the topic
- every research level-two heading covered or explicitly excluded with a reason
- recall prompts tied to the objectives they test
- `/research/<slug>/` reachable from every page

## Verify

```bash
node .agents/bin/harness.mjs check --layer=static
node .agents/bin/harness.mjs check --layer=runtime
node .agents/bin/harness.mjs receipt <slug>
```

Inspect the rendered topic and the home dashboard in desktop and mobile widths
and light and dark themes.