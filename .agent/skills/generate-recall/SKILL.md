---
name: generate-recall
description: Generate topic-specific, answer-hidden active-recall prompts linked to exact learning objectives and sections, including prediction, debugging, application, architecture, and trade-off reasoning.
---

# Generate Recall

Derive questions from the topic's objectives, mechanism, failure model, code, architecture, and production decisions. Include only categories supported by the material: recall, understanding, prediction, application, debugging, architecture, and trade-offs.

Each `KnowledgeCheck` needs:

- a stable topic/question ID;
- a prompt that cannot be answered by generic vocabulary alone;
- an answer hidden until requested;
- the correct explanation;
- a real misconception from the material;
- a link to the exact review section.

Prefer a small set with broad objective coverage over repetitive questions. Require retrieval before reveal. Use the browser-local rating schedule honestly: Forgot 1 day, Difficult 3 days, Remembered 7 days, Easy 21 days. Do not claim adaptive FSRS or cross-device synchronization.
