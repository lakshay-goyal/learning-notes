# Official documentation analysis

Use after the research plan identifies questions that should have authoritative answers.

1. Establish the canonical project site, specification/standard, documentation, repository, and security/release channels.
2. Record the stable release or specification revision and date before copying APIs or behavior.
3. Follow the relevant architecture, concepts, API/configuration reference, examples, release, migration, and security sections—not only the landing page.
4. Map each inspected page to research-plan questions and capture its limitations in `sources.md`.
5. Cross-check consequential API signatures and configuration fields against source, generated API references, or official examples for the same version.
6. Separate normative specification language from SDK conveniences and implementation-specific behavior.
7. Record official gaps, then route those questions to source-code or engineering-practice research.

Completion condition: every major design/API claim has same-version primary evidence or is explicitly labeled unresolved/inferred. Never infer a documented guarantee from an example alone.
