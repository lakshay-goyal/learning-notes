# Publish learning

Use for a validated research topic without an existing visual learning page.

1. Run `node scripts/deep-learn-visual.mjs inspect <slug>`.
2. Read `.doty/config.json`, the complete research package, `.agent/config.json`, and the visual rules.
3. Use `structure-knowledge` to derive objectives, prerequisites, concept dependencies, and the four access levels.
4. Create the coverage map before drafting; update it as destinations stabilize.
5. Use `visualize-concept` only for questions where a spatial, sequential, comparative, or interactive representation improves understanding.
6. Use `generate-learning-page`, reusing existing components and a stable `learning.id`.
7. Use `generate-recall` and `connect-knowledge`.
8. Run `validate-learning-docs`, both CLI validations, tests, and the production build.
9. Inspect the rendered topic and home dashboard in desktop/mobile and light/dark modes.

Completion requires a useful end-to-end topic, not a scaffold.
