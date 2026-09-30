# Objective coverage rules

Coverage maps prove a research finding is *reachable*. It does not prove the
learner can *demonstrate* anything. That is the job of objective coverage.

## The chain

```text
objective  →  concept  →  page  →  assessment  →  evidence
```

Each link is checkable, and each was previously missing except the first.

## The rules

1. **Objectives are declared once**, in `docs/<slug>/learning.md`, with stable
   `<topicId>.<name>` IDs. They are the only definition of what a topic teaches.

2. **Every page declares at least one objective.** A page with no objective is a
   page nobody can assess.

3. **Every page declares at least one assessment.** An assessment evidences the
   objectives on that page.

4. **Every objective resolves to an assessment** somewhere in the topic. An
   objective no page assesses is a claim, not a goal. The validator reports
   `objectives with an assessment / total objectives`.

5. **Every objective a page names exists in the design.** A page cannot invent
   objectives the topic never declared, which would let a page quietly expand the
   contract.

6. **Every concept a page names exists in the design**, for the same reason.

## Why an assessment, not a question

An assessment produces evidence that the learner can do something:

| Weak | Strong |
| --- | --- |
| "Define the boundary model." | "Predict what happens when the tool is missing, then explain why." |
| "What is the failure mode?" | "Given this error, which surface reported it and what would you check first?" |
| "List the alternatives." | "Choose between A and B under this constraint, and state what you gave up." |

Recognition is not demonstration. A page can pass every structural check while
teaching nothing testable, which is exactly the failure this rule exists to catch.

## Interleaving

Place a prediction immediately after the mechanism it predicts, not in one block
at the end of the topic. Retrieval works when it interrupts; a deferred block is a
final exam. Keep one consolidated review page for the delayed pass.

## Vocabulary

Objective, concept, assessment, lab, and evidence are defined once in
`.agents/GLOSSARY.md`. Coverage is not learning.