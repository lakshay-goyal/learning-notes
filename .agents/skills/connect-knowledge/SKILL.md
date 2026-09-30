---
name: connect-knowledge
description: "Add stable-ID relationships between published topics where routes exist."
invocation: model
---

# Connect Knowledge

Inspect existing `learning` metadata and routes before adding relationships. Use one of the configured semantic types and a stable destination ID. Add a relationship only when the technical connection is explainable and the route exists.

Prefer filesystem metadata and internal links; the installed site-graph plugin derives navigation/backlinks from those links. Do not add a graph database.

For missing prerequisite topics, display plain prerequisite text or propose a future topic; do not create a broken relation. During updates, preserve IDs and routes, remove stale links only after verifying the destination, and let the Astro link validator catch route errors.
