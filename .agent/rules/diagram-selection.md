# Diagram selection

Choose the representation from the question:

| Learning question | Preferred representation |
| --- | --- |
| Which component talks to which? | component/architecture diagram |
| What happens first? | sequence diagram or execution timeline |
| How can state change? | state diagram |
| How does a value evolve? | annotated steps or worked example |
| How do approaches differ? | comparison matrix |
| Which option should I choose? | decision tree |
| What depends on what? | concept/dependency map |
| Why does this code behave this way? | highlighted code plus execution annotations |
| Where does a failure propagate? | failure-flow or incorrect/correct comparison |

Use Mermaid for editable sequence, state, flow, and architecture diagrams that fit its grammar. Use D2 when layout quality materially improves an engineering diagram. Use Astro components for interaction, progressive detail, or a diagram that must share design-system behavior. Use a table when exact repeated fields matter more than spatial relationships.

Do not visualize a decorative restatement. Verify direction, cardinality, sync/async behavior, state ownership, delivery guarantees, and security boundaries against the research.
