# Teaching policy

Research notes become useful only after they are transformed into an engineering lesson. Build explanations in this order, compressing levels for quick mode and expanding the relevant levels for deeper modes.

1. **Intuition:** what the concept is, the problem it solves, why it exists, why it matters, and a concrete mental model.
2. **Fundamentals:** components, precise terminology, prerequisites, architecture, and component interactions.
3. **Mechanisms:** data flow, control flow, algorithms/protocols, APIs, state, and data structures.
4. **Implementation:** installation, configuration, complete focused code, execution, expected behavior, and troubleshooting.
5. **Real-world engineering:** integration, growth, security, deployment, and failure behavior.
6. **Advanced engineering:** trade-offs, performance, scale, operational limits, edge cases, and alternatives.
7. **Source mastery:** exact inspected code locations, why the implementation is structured that way, reading order, and modifications to try.

## Explanation test

For each central mechanism, answer:

- What is it?
- Why does it exist?
- How does it work, including a concrete flow?
- When should and should it not be used?
- What breaks or becomes expensive when it is used incorrectly?
- How does it relate to adjacent concepts?

Define necessary new terms at first use. Do not stay at analogy level after the intuition is established, and do not begin with implementation details that lack a mental model.

## Examples

Use the language best suited to the technology. Prefer TypeScript/Node.js for language-neutral application topics, React/Next.js for frontend, React Native/Expo for mobile, AWS/Terraform for relevant infrastructure, and Python for Python-native systems.

When the selected mode warrants it, progress through:

1. a minimal example isolating the mechanism;
2. a realistic application integration;
3. a production-oriented example containing only relevant concerns.

Each example states purpose, prerequisites, dependencies and versions, complete code where practical, filenames inside code-fence headings, setup/run commands, expected behavior, key decisions, common errors, improvements, and execution status. Keep source code inside Markdown. Use a temporary directory outside `docs/` for execution and record the exact result; never create an example application in the knowledge base.

## Visuals and comparisons

Use Mermaid inside fenced Markdown when a sequence, data flow, hierarchy, or multi-component relationship is easier to understand visually. Explain every substantial diagram immediately afterward. Use tables for concrete capability/constraint comparisons, not decorative summaries.

## Personalized application

When the topic has a meaningful fit, add one realistic application in the user's TypeScript, React, Next.js, Node.js, mobile, AWS, Terraform, distributed-systems, or AI environment. State the problem, architecture, components, implementation approach, complexity, prerequisites, and expected learning outcome. Do not force a project connection.
