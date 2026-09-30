# Taxonomy registry

`taxonomy.json` is the canonical stable-ID registry for the four taxonomy facets currently used by learning pages:

- `domainIds`
- `fieldIds`
- `skillIds`
- `toolIds`

IDs are durable references, not route names. Add an ID here before a page uses it; changing a label or route does not require changing the ID. The visual validator rejects unknown IDs, while the research harness treats taxonomy as optional metadata.
