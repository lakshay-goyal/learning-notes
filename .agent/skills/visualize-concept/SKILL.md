---
name: visualize-concept
description: Select and implement an accurate, accessible visual representation for a researched technical mechanism, architecture, sequence, state change, comparison, algorithm, or code behavior.
---

# Visualize Concept

Read the relevant research and `.agent/rules/diagram-selection.md` plus `.agent/rules/visual-design.md`.

Start with the learner question. Choose the smallest representation that makes the answer clearer: component diagram, sequence/timeline, state diagram, worked example, code transformation, comparison matrix, decision tree, or concept map.

Use the installed stack deliberately:

- `ConceptDiagram`/Astro components for interactive inspection and shared learning behavior;
- Mermaid for editable sequences, state, flow, and architecture in Markdown/MDX;
- D2 when its layout materially improves an engineering diagram;
- Expressive Code plus `CodeWalkthrough` for syntax and execution;
- tables for exact field-by-field comparisons.

Verify direction, timing, state ownership, guarantees, failure paths, and security boundaries against sources. Provide a text equivalent, responsive inspection, keyboard behavior, and theme readability. Update the coverage map. Do not add a visual merely to decorate a section.
