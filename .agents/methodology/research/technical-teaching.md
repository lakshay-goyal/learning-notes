# Technical lesson construction

Read `.agents/policies/teaching-policy.md` before authoring the main lesson or implementation guide.

Build a narrative from the learner's problem and mental model into component interaction, mechanisms, implementation, real-world operation, advanced trade-offs, and inspected code. Use the research plan as a coverage map, not as the lesson outline.

For each central mechanism, include a concrete request/data/control-flow walkthrough and at least one failure or misuse scenario. Place citations beside the claims they support. Define necessary terms at first use. Link adjacent knowledge using relative links rather than repeating whole prior lessons.

Examples must use verified same-version APIs and carry `TESTED` or `NOT EXECUTED` status. Keep code in Markdown fences, identify filenames, and include setup/run/output/troubleshooting. Use Mermaid for relationships that prose cannot convey as clearly, then explain the diagram.

Completion condition: a reader at the stated prerequisite level can describe the mechanism, implement a focused example, anticipate important failures, compare alternatives, and identify the next source/code path to inspect.
