---
name: generate-learning-page
description: Create or incrementally update a reusable Astro/Starlight Markdown or MDX topic page from a knowledge structure and coverage map while preserving research access and stable routes.
---

# Generate Learning Page

Use the existing Starlight content collection and `src/components/learning/`. Add `learning` frontmatter with a stable `id`, category, difficulty, `researchSlug`, update date, prerequisites, and only real route-backed relationships.

Follow the topic's knowledge structure rather than blindly copying research headings. Lead with Quick Recall, teach the problem and core mechanism, add practical code or worked behavior, use focused deep dives for advanced material, expose all original research routes, and end with active recall and primary references. Omit inapplicable sections.

Prefer plain Markdown when custom behavior is unnecessary. In MDX, import only used components. Preserve the topic route and ID during updates. Use `.agent/templates/` as prompts, not content to copy unchanged.

Update the coverage map as section anchors settle, then run the visual validator and Astro build.
