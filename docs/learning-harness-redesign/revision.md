# Retrieval guide: Learning Harness Redesign

Use this after completing the relevant chapter. Answer aloud or in writing before revealing the answer. For architecture questions, explain trade-offs rather than repeating vocabulary.

## Level 1 — Mental model

1. What is the difference between a content-governance system and a learning system?
2. Why is the current harness an example of accidental architecture?
3. What does research source truth guarantee, and what does it not guarantee?
4. Why can a technically valid page still be pedagogically overwhelming?

<details>
<summary>Reveal guidance</summary>

A learning system must connect durable knowledge to observable objectives, practice, feedback, retention, and transfer. A content-governance system can enforce files, links, schemas, and statuses without proving that the learner can explain, implement, debug, or design.

</details>

## Level 2 — Content ontology

1. Distinguish domain, field, learner skill, tool, topic, module, page, concept, lab, and assessment.
2. Which relationships should be hierarchical?
3. Why should skills be many-to-many facets instead of parent directories?
4. What is the difference between a topic and a page?
5. When is a concept better represented as a reusable node than as a heading?

<details>
<summary>Reveal guidance</summary>

Use a primary domain → field → topic → module → page hierarchy for navigation. Attach skills, tools, concepts, and learning paths through stable IDs and many-to-many relationships. A topic is a bounded learning contract; a page is one focused delivery unit.

</details>

## Level 3 — Mechanisms

1. Why does a fixed `pages.length === 1` check force a mega-page?
2. Why do globally unique page IDs prevent a normal multi-page model?
3. How does an H2-to-anchor coverage map differ from objective coverage?
4. Why is a research plan not the first learner page?
5. Why should active recall be interleaved with instruction and also have a consolidated review page?

<details>
<summary>Reveal guidance</summary>

The validator is the architecture: multiple pages fail, duplicate topic IDs fail, and a coverage destination can be the research archive. Fixed research files silo content by artifact type, while one-page publishing tries to compress all of it. Retrieval is strongest when it follows the relevant explanation and is repeated later through a broader review route.

</details>

## Level 4 — Architecture decisions

1. A topic has one overview and five child pages. What must be unique, and what must be shared?
2. How do you preserve a route when taxonomy changes?
3. Why derive the research backlink from a manifest or collection instead of hardcoding a slug?
4. What is the difference between research integrity and learning coverage?
5. Why should a publisher be forbidden from introducing new technical claims?

<details>
<summary>Reveal guidance</summary>

`topicId` is shared; `pageId` and route are unique. Keep aliases or redirects for old routes. Derive backlinks from a canonical catalog. Research integrity protects evidence sections; learning coverage proves objectives are taught and assessed. A publisher is a presentation agent, not a new source of truth.

</details>

## Level 5 — Harness and agent design

1. Why should intent, depth, scope, and context be separate fields?
2. What must be true before parallel module authors start?
3. Why should a verifier not edit the content it verifies?
4. How do you prevent one agent from making a structural change while another assumes the old structure?
5. What belongs in a topic manifest that should not be duplicated in frontmatter, Astro config, and the homepage?

<details>
<summary>Reveal guidance</summary>

Intent is a workflow choice; depth and context change scope and evidence. The manager must freeze IDs, dependencies, routes, and ownership before parallel work. A verifier needs independence. Canonical manifest data should drive frontmatter generation, navigation, backlinks, dashboard aggregation, and validation.

</details>

## Level 6 — Failure and recovery

1. A research package is deleted while its visual page remains. Which checks should fail?
2. A new topic is partially written. How should the command recover?
3. A relative learning-page link is broken. Why might both current validators miss it?
4. A page is published while its research status is draft. What principle was violated?
5. A browser has malformed or full local storage. How should the page behave?

<details>
<summary>Reveal guidance</summary>

The graph should report missing research, stale index/coverage, and orphan visual pages. Scaffolding should be atomic or recoverable. Link validation must cover relative and root-relative links, not only custom route prefixes. Publication must be an explicit state transition, not file presence. Progress storage should fail softly, preserve content, and offer recovery/export.

</details>

## Level 7 — Transfer challenge

Design a learning platform for distributed systems.

Your answer must include:

1. a domain/field/skill registry;
2. a prerequisite graph for one topic;
3. one overview and three child pages;
4. one executable lab;
5. one debugging assessment;
6. one transfer question;
7. a freshness rule;
8. a progress record;
9. a multi-agent write-ownership plan;
10. migration acceptance tests.

There is no single correct page count. A strong answer explains why each boundary exists and how the system proves that a learner can transfer the knowledge.

## Review record

No learner review has been completed yet. After a review, record:

- date;
- answers that demonstrated strong reasoning;
- misconceptions;
- objectives that need practice;
- pages or exercises to revisit;
- the next review date;
- any requested harness change.
