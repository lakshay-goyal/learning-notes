---
name: generate-learning-page
description: "Author or update one focused learning page from the topic learning design."
invocation: model
---

# Generate Learning Page

Use the existing Starlight content collection and `src/components/learning/`. Add `learning` frontmatter with a stable `id`, `topicId`, `pageId`, `kind`, category, difficulty, `researchSlug`, update date, objectives/assessments, prerequisites, and only real route-backed relationships. Use `.agents/templates/visual/topic.mdx` for an overview and `.agents/templates/visual/module.mdx` for a focused child page.

Follow the topic's knowledge structure rather than blindly copying research headings. Lead with Quick Recall, teach the problem and core mechanism, add practical code or worked behavior, use focused deep dives for advanced material, expose all original research routes, and end with active recall and primary references. Omit inapplicable sections.

Prefer plain Markdown when custom behavior is unnecessary. In MDX, import only used components. Preserve the topic route and ID during updates. Use `.agents/templates/visual/` as prompts, not content to copy unchanged.

Update the coverage map as section anchors settle, then run the visual validator and Astro build.
