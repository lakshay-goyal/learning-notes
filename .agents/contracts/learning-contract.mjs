/**
 * The canonical topic/page contract.
 *
 * This module is the single definition of page identity for the repository.
 * It replaces the conflation of topic identity and page identity that the old
 * `learning.id` field forced:
 *
 *   - `learning.id`      was BOTH the topic identity and the page identity
 *   - `learning.id`      is now only the page's unique `pageId`
 *   - `learning.topicId` is the shared topic identity
 *
 * Backwards compatibility is deliberate and total. A page that declares only
 * the legacy `id` resolves to `topicId === pageId === id` and `kind: 'overview'`,
 * which is exactly the shape every currently published page already has. No
 * existing page or route needs editing, and the legacy single-page topic stays
 * legal.
 */

import { readIdList, readString } from '../lib/frontmatter.mjs';

export const PAGE_KINDS = ['overview', 'module', 'deep-dive', 'practice', 'review'];
export const RESEARCH_STATUSES = ['draft', 'researched', 'validated', 'needs-refresh'];

/**
 * Access levels a page can declare. These are the canonical values; the
 * `requiredLearningLevels` key in `.agents/config.json` is the legacy mirror of
 * this list and is reconciled by a config-honesty test.
 */
export const LEARNING_LEVELS = [
	'quick-recall',
	'visual-understanding',
	'complete-understanding',
	'active-recall',
];

/**
 * Publication state. A research topic with no learning pages is a legitimate
 * state, not a validation failure: it is `research-only`.
 */
export const PUBLICATION_STATES = ['research-only', 'planned', 'published', 'incomplete', 'archived'];

/** Stable IDs are lowercase kebab-case so they survive taxonomy and route changes. */
export const STABLE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Taxonomy facets that reference entries in the shared registry (Phase 2). */
export const TAXONOMY_FACETS = ['domainIds', 'fieldIds', 'skillIds', 'toolIds'];

/** The default used when a legacy page declares no `kind`. */
export const DEFAULT_PAGE_KIND = 'overview';

/** The default used when a legacy page declares no `order`. */
export const DEFAULT_PAGE_ORDER = 0;

function idListProblem(facet, ids) {
	if (ids.length === 0) return undefined;
	const invalid = ids.filter((id) => !STABLE_ID.test(id));
	return invalid.length
		? `${facet} must use stable kebab-case IDs, found: ${invalid.join(', ')}`
		: undefined;
}

/**
 * Resolve one learning page into the canonical contract shape.
 *
 * Never throws for content problems. Problems are collected so a single run can
 * report every contract violation in a topic instead of stopping at the first.
 */
export function resolvePage({ file, learning }) {
	const problems = [];
	const id = readString(learning, 'id');
	const topicId = readString(learning, 'topicId') ?? id;
	const pageId = readString(learning, 'pageId') ?? id;
	const researchSlug = readString(learning, 'researchSlug');
	const kind = readString(learning, 'kind') ?? DEFAULT_PAGE_KIND;
	const level = readString(learning, 'level');
	const category = readString(learning, 'category');
	const difficulty = readString(learning, 'difficulty');
	const objectiveIds = readIdList(learning, 'objectiveIds');
	const assessmentIds = readIdList(learning, 'assessmentIds');
	const conceptIds = readIdList(learning, 'conceptIds');
	const labIds = readIdList(learning, 'labIds');
	const taxonomy = Object.fromEntries(TAXONOMY_FACETS.map((facet) => [facet, readIdList(learning, facet)]));

	if (!id) problems.push('learning.id is missing');
	if (!pageId) problems.push('learning.pageId is missing (or the legacy learning.id)');
	if (!topicId) problems.push('learning.topicId is missing (or the legacy learning.id)');
	if (!researchSlug) problems.push('learning.researchSlug is missing');
	if (id && !STABLE_ID.test(id)) problems.push(`learning.id must be a stable kebab-case ID, found "${id}"`);
	if (id && topicId && !STABLE_ID.test(topicId)) {
		problems.push(`learning.topicId must be a stable kebab-case ID, found "${topicId}"`);
	}
	if (id && pageId && !STABLE_ID.test(pageId)) {
		problems.push(`learning.pageId must be a stable kebab-case ID, found "${pageId}"`);
	}
	if (!PAGE_KINDS.includes(kind)) {
		problems.push(`learning.kind "${kind}" is invalid, expected one of ${PAGE_KINDS.join(', ')}`);
	}

	const rawOrder = learning?.order;
	let order = DEFAULT_PAGE_ORDER;
	if (rawOrder === undefined || rawOrder === null || rawOrder === '') {
		order = DEFAULT_PAGE_ORDER;
	} else if (typeof rawOrder === 'number' && Number.isFinite(rawOrder)) {
		order = rawOrder;
	} else {
		problems.push(`learning.order must be a number, found "${rawOrder}"`);
	}

	for (const facet of TAXONOMY_FACETS) {
		const problem = idListProblem(facet, taxonomy[facet]);
		if (problem) problems.push(problem);
	}

	// A child page that claims no objective is a page nobody can assess.
	if (PAGE_KINDS.includes(kind) && kind !== DEFAULT_PAGE_KIND && objectiveIds.length === 0) {
		problems.push(`learning.kind "${kind}" requires at least one learning.objectiveIds entry`);
	}

	return {
		file,
		id,
		topicId,
		pageId,
		kind,
		level,
		order,
		category,
		difficulty,
		researchSlug,
		objectiveIds,
		assessmentIds,
		conceptIds,
		labIds,
		taxonomy,
		problems,
		/** True when the page still relies on the legacy `id`-only shape. */
		legacy: !learning?.topicId && !learning?.pageId,
	};
}

/** A page is a valid overview when it is the only page claiming `kind: overview`. */
export function isOverview(page) {
	return page.kind === DEFAULT_PAGE_KIND;
}

/**
 * Validate a whole topic's page set against the multi-page contract.
 *
 * The invariant, replacing the old `pages.length === 1` rule:
 *
 *   exactly one overview page
 *   zero or more module / deep-dive / practice / review pages
 *   one shared topicId
 *   one unique pageId per page
 *   one unique route per page
 */
export function validatePageSet(pages, { routes = new Map() } = {}) {
	const problems = [];
	const overviews = pages.filter(isOverview);

	if (pages.length > 0 && overviews.length === 0) {
		problems.push('topic has no overview page; exactly one page must declare learning.kind: overview');
	}
	if (overviews.length > 1) {
		const names = overviews.map((page) => page.pageId).join(', ');
		problems.push(`topic has ${overviews.length} overview pages (${names}); exactly one is allowed`);
	}

	const seenPageIds = new Map();
	const seenRoutes = new Map();
	for (const page of pages) {
		if (!page.pageId) continue;

		if (seenPageIds.has(page.pageId)) {
			problems.push(
				`duplicate learning.pageId "${page.pageId}" in ${short(seenPageIds.get(page.pageId))} and ${short(page.file)}`,
			);
		} else {
			seenPageIds.set(page.pageId, page.file);
		}

		const route = routes.get(page.file);
		if (route && seenRoutes.has(route)) {
			problems.push(
				`duplicate route "${route}" produced by ${short(seenRoutes.get(route))} and ${short(page.file)}`,
			);
		} else if (route) {
			seenRoutes.set(route, page.file);
		}
	}

	// All pages in one topic must agree on the stable topic identity.
	const topicIds = new Set(pages.map((page) => page.topicId).filter(Boolean));
	if (topicIds.size > 1) {
		problems.push(`topic pages disagree about topicId (${[...topicIds].join(', ')}); one topic must have one shared topicId`);
	}

	// One topic is one research package. A page may not split itself across two.
	const researchSlugs = new Set(pages.map((page) => page.researchSlug).filter(Boolean));
	if (researchSlugs.size > 1) {
		problems.push(
			`topic pages disagree about researchSlug (${[...researchSlugs].join(', ')}); one topic maps to one research package`,
		);
	}

	const declaredOrders = pages.filter((page) => isOverview(page) || page.order !== DEFAULT_PAGE_ORDER);
	const orderKeys = new Set();
	for (const page of declaredOrders) {
		if (orderKeys.has(page.order)) {
			problems.push(`duplicate learning.order "${page.order}" in topic; page order must be unique`);
		}
		orderKeys.add(page.order);
	}

	return problems;
}

function short(file) {
	return String(file).split('/').slice(-3).join('/');
}

/**
 * Site-wide invariants that no single topic can check on its own.
 *
 *   - `pageId` is unique across the whole learning site
 *   - `topicId` maps to exactly one research package
 *   - every page route is unique
 *   - every page's `researchSlug` resolves to a real research topic
 */
/**
 * @param acknowledgedTargets absolute paths recorded in
 *   `.agents/state/exceptions.json`. An orphan that was deliberately preserved
 *   is reported as acknowledged rather than as an unknown failure, so a red gate
 *   always means something new.
 */
export function validateGlobalContract(pages, { routes = new Map(), researchSlugs = new Set(), acknowledgedTargets = new Set() } = {}) {
	const problems = [];
	const acknowledged = [];
	const seenPageIds = new Map();
	const topicToResearch = new Map();
	const seenRoutes = new Map();

	for (const page of pages) {
		if (page.pageId) {
			if (seenPageIds.has(page.pageId)) {
				problems.push(
					`duplicate learning.pageId "${page.pageId}" in ${short(seenPageIds.get(page.pageId))} and ${short(page.file)}`,
				);
			} else {
				seenPageIds.set(page.pageId, page.file);
			}
		}

		if (page.topicId && page.researchSlug) {
			const previous = topicToResearch.get(page.topicId);
			if (previous && previous !== page.researchSlug) {
				problems.push(
					`topicId "${page.topicId}" maps to two research packages (${previous} and ${page.researchSlug})`,
				);
			} else {
				topicToResearch.set(page.topicId, page.researchSlug);
			}
		}

		const route = routes.get(page.file);
		if (route && seenRoutes.has(route)) {
			problems.push(
				`duplicate route "${route}" produced by ${short(seenRoutes.get(route))} and ${short(page.file)}`,
			);
		} else if (route) {
			seenRoutes.set(route, page.file);
		}

		if (page.researchSlug && researchSlugs && !researchSlugs.has(page.researchSlug)) {
			// Acknowledged orphans are returned separately rather than dropped, so
			// a caller can surface them without failing the run.
			if (acknowledgedTargets.size === 0 || !acknowledgedTargets.has(page.file)) {
				problems.push(
					`orphan learning page: ${short(page.file)} references research topic "${page.researchSlug}", which has no docs/<slug>/README.md`,
				);
			} else {
				acknowledged.push(
					`${short(page.file)} is an acknowledged orphan: research topic "${page.researchSlug}" was deliberately removed`,
				);
			}
		}
	}

	problems.acknowledged = acknowledged;
	return problems;
}

/** Group pages by their canonical topic identity. */
export function groupByTopic(pages) {
	const groups = new Map();
	for (const page of pages) {
		const key = page.topicId || page.researchSlug || page.pageId;
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(page);
	}
	return groups;
}

/**
 * Derive the published route for a learning page from its file path.
 * `.../topic/index.mdx` -> `/.../topic/`
 */
export function routeForFile(learningDir, file) {
	const relative = String(file).slice(String(learningDir).length).replace(/\\/g, '/');
	const withoutExtension = relative.replace(/\.mdx?$/, '');
	const segments = withoutExtension.split('/').filter(Boolean);
	if (segments.at(-1) === 'index') segments.pop();
	return `/${segments.join('/')}${segments.length ? '/' : ''}`;
}
