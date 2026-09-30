/**
 * The canonical research vocabulary.
 *
 * Module 5 of `docs/learning-harness-redesign` names "one vocabulary, one
 * parser, one schema" as the highest-leverage harness change. These values used
 * to live only inside `.agents/bin/deep-learn.mjs` while the learning contract
 * in the sibling module owned the page vocabulary, so the two halves of the
 * harness disagreed about what a valid status is.
 *
 * Everything that validates research imports from here:
 *   - `.agents/bin/deep-learn.mjs`      the research CLI
 *   - `.agents/policies/*.md`           documented vocabulary
 *   - `scripts/deep-learn.test.mjs`     the drift guard
 *
 * The learning vocabulary (page kinds, access levels, taxonomy facets) stays in
 * `learning-contract.mjs` because `src/content.config.ts` imports it directly
 * and the Astro schema test asserts that exact import statement.
 */

/** The research lifecycle. `validated` never means "every fact is guaranteed". */
export const RESEARCH_STATUSES = ['draft', 'researched', 'validated', 'needs-refresh'];

/** Statuses a topic may hold when it is created by the scaffolder. */
export const INITIAL_RESEARCH_STATUS = 'draft';

/** Justified source types recorded in `sources.md`. */
export const SOURCE_TYPES = [
  'OFFICIAL_DOCUMENTATION',
  'SPECIFICATION',
  'SOURCE_CODE',
  'RELEASE_NOTES',
  'SECURITY_ADVISORY',
  'ENGINEERING_BLOG',
  'RESEARCH_PAPER',
  'CASE_STUDY',
  'COMMUNITY_DISCUSSION',
  'MAINTAINER_COMMENT',
];

/**
 * How honestly a source was used.
 *
 * `DISCOVERED_NOT_ANALYZED` exists so "we found it" can never be reported as
 * "we read it". A source count is not a quality metric.
 */
export const INSPECTION_STATUSES = ['ANALYZED', 'SOURCE_INSPECTED', 'DISCOVERED_NOT_ANALYZED'];

/**
 * Honest execution labels for runnable examples.
 *
 * These are deliberately *allowed* in strict validation. `research-policy.md`
 * requires an author to label an unverifiable version `UNVERIFIED` and an
 * unrun example `NOT EXECUTED`; a validator that bans those words punishes
 * honesty and pushes authors into vague prose. `requireVersionVerification`
 * enforces honesty where it belongs — on the topic's own `versions` field.
 */
export const EXECUTION_LABELS = {
  unverified: 'UNVERIFIED',
  notExecuted: 'NOT EXECUTED',
  tested: 'TESTED',
};

/** Research depth profiles. Kept here so the CLI and the docs agree. */
export const RESEARCH_MODES = ['quick', 'deep', 'production', 'codebase', 'review'];

/** Membership helpers. Sets are built once at module load. */
export const RESEARCH_STATUS_SET = new Set(RESEARCH_STATUSES);
export const SOURCE_TYPE_SET = new Set(SOURCE_TYPES);
export const INSPECTION_STATUS_SET = new Set(INSPECTION_STATUSES);
export const RESEARCH_MODE_SET = new Set(RESEARCH_MODES);