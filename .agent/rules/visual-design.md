# Visual design rules

Reuse Starlight tokens and the semantic learning tokens in `src/styles/learning.css`:

- blue: concepts and protocol/fundamental flow
- green: successful implementation and valid behavior
- amber: caution, decision, or operational boundary
- red: failures and security-critical boundaries
- purple: advanced concepts, models, and source internals

Prefer static Astro components. Add scoped browser scripts only for interaction with clear learning value. Keep focus visible, use native buttons/details/fieldsets, announce changing status, respect reduced motion, and provide a text alternative for diagrams.

Every diagram must answer a question. Labels must remain readable in both themes and at narrow widths. Use horizontal inspection with an explicit accessible label when a diagram cannot responsibly collapse on mobile.

Do not add a new library when an installed, maintained capability already fits. Keep global styling small and component behavior local.
