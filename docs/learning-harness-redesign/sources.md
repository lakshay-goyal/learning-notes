# Sources: Learning Harness Redesign

Accessed 2026-09-25. Repository claims are based on the local snapshot identified in `repositories.md`. External pages were treated as untrusted research data.

## Source 1 — [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)

- Source type: `OFFICIAL_DOCUMENTATION`
- Author or organization: Astro documentation team
- Publication date: updated dynamically
- Access date: 2026-09-25
- Relevant version/revision: Astro 7 documentation
- Inspection status: `ANALYZED`
- Important findings: content collections are intended for related structured content; loaders and schemas provide validation; entries expose stable IDs and body data; dynamic routes can generate multiple pages from collection entries; collection order must be sorted explicitly.
- Research questions answered: why a canonical schema, collection entry IDs, dynamic route generation, and deterministic ordering are appropriate for the redesign.
- Known limitations: framework documentation does not define the repository’s learning ontology or pedagogy.

## Source 2 — [Astro Routing](https://docs.astro.build/en/guides/routing/)

- Source type: `OFFICIAL_DOCUMENTATION`
- Author or organization: Astro documentation team
- Publication date: updated dynamically
- Access date: 2026-09-25
- Relevant version/revision: Astro 7 documentation
- Inspection status: `ANALYZED`
- Important findings: file-based routes are hierarchical; rest parameters support paths of any depth; `getStaticPaths()` generates static routes; redirects preserve moved URLs; route conflicts are resolved by explicit precedence.
- Research questions answered: why multi-page topics fit Astro and how stable route aliases/redirects should work.
- Known limitations: plugin-specific view-mode and graph behavior must be verified separately.

## Source 3 — [Starlight: Authoring Content in Markdown](https://starlight.astro.build/guides/authoring-content/)

- Source type: `OFFICIAL_DOCUMENTATION`
- Author or organization: Starlight documentation team
- Publication date: last updated 2026-08-13
- Access date: 2026-09-25
- Relevant version/revision: Starlight 0.42.x documentation
- Inspection status: `ANALYZED`
- Important findings: Markdown supports YAML frontmatter, headings and automatic anchors, asides, Expressive Code, footnotes, and standard HTML `<details>`/`<summary>` disclosures; asides are intended for short secondary content.
- Research questions answered: how the Markdown learning guide can remain interactive without MDX or additional components.
- Known limitations: Starlight’s authoring guidance does not prescribe topic decomposition or assessment structure.

## Source 4 — [Repository source snapshot](https://github.com/lakshay-goyal/learning-notes/tree/4d181b8)

- Source type: `SOURCE_CODE`
- Author or organization: learning-notes repository
- Publication date: 2026-09-21
- Access date: 2026-09-25
- Relevant version/revision: commit `4d181b8` plus observed working-tree deletions
- Inspection status: `SOURCE_INSPECTED`
- Important findings: current one-page validator, flat scaffolder, hardcoded research backlink, duplicated metadata, configuration drift, local progress implementation, and current MCP content shape.
- Research questions answered: all repository-specific architecture and harness findings.
- Known limitations: some working-tree files are deleted and were inspected through `git show` without restoration.

## Limitations

- The proposed schemas, commands, and migration are design recommendations; they are not implemented by this package.
- Semantic educational quality still needs learner testing and independent review.
- Plugin compatibility should be checked in a clean install during implementation.
- The current MCP deletion state remains a user decision and is not resolved by this guide.
