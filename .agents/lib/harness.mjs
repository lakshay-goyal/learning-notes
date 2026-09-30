/**
 * Shared harness loading and state helpers.
 *
 * Both CLIs, the harness orchestrator, and the tests need the same four things:
 * a resolved repository root, a validated config, the canonical vocabularies,
 * and the ability to record an acknowledged exception. Those lived as four
 * near-identical copies, which is how `.agents/config.json` accumulated 22 keys
 * that no code read.
 *
 * This module is the only place that resolves `.agents/` paths, so a new config
 * key becomes reachable from one import instead of three.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FrontmatterError, readFrontmatter } from './frontmatter.mjs';
import {
	INSPECTION_STATUS_SET,
	RESEARCH_MODE_SET,
	RESEARCH_STATUS_SET,
	SOURCE_TYPE_SET,
} from '../contracts/research-contract.mjs';
import {
	LEARNING_LEVELS,
	PAGE_KINDS,
	PUBLICATION_STATES,
	RESEARCH_STATUSES,
	STABLE_ID,
	TAXONOMY_FACETS,
} from '../contracts/learning-contract.mjs';

export { FrontmatterError, readFrontmatter };

/** The repository root, derived from this file's location. */
export const HARNESS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Default values for every key the harness understands. */
export const CONFIG_DEFAULTS = {
	version: 3,
	harnessName: 'learning-harness',
	harnessRoot: '.agents',
	outputDirectory: 'docs',
	defaultMode: 'deep',
	researchDirectory: 'docs',
	researchTemplateDirectory: '.agents/templates/research',
	visualTemplateDirectory: '.agents/templates/visual',
	taxonomyRegistry: '.agents/registry/taxonomy.json',
	learningDirectory: 'src/content/docs',
	coverageDirectory: '.agents/coverage',
	learningComponentsDirectory: 'src/components/learning',
	stateDirectory: '.agents/state',
	evidenceDirectory: '.agents/evidence',
	reviewRecordDirectory: '.agents/reviews',
	featureListPath: '.agents/features.json',
	progressFile: '.agents/PROGRESS.md',
	glossaryFile: '.agents/GLOSSARY.md',
	exceptionsFile: '.agents/state/exceptions.json',
	researchRoutePrefix: '/research',
	progressStorage: 'browser-local',
	progressStorageKey: 'deep-learn-visual:v1',
	requiredLearningDesignFile: 'learning.md',
	pagePlanning: {
		defaultPageCount: 4,
		minimumPageCount: 3,
		maximumPageCount: 12,
		kindsByMode: {
			quick: ['overview', 'practice'],
			deep: ['overview', 'module', 'module', 'deep-dive', 'practice', 'review'],
			production: ['overview', 'module', 'module', 'deep-dive', 'practice', 'review'],
			codebase: ['overview', 'module', 'deep-dive', 'deep-dive', 'practice', 'review'],
			review: ['overview', 'practice', 'review'],
		},
	},
	validation: {
		failOnBrokenLocalLinks: true,
		failOnNonMarkdownLearningFiles: true,
		requireIndexEntry: true,
		requireCoverageMap: true,
		requireResearchLink: true,
		requireStableTopicId: true,
		requireAstroBuild: true,
		requireLearningDesignFile: true,
		requireObjectiveAssessmentCoverage: true,
		requireReviewDirectoryExclusion: true,
	},
};

/** Read and parse JSON, throwing a clear error with the offending path. */
export function readJson(path) {
	try {
		return JSON.parse(readFileSync(path, 'utf8'));
	} catch (error) {
		throw new Error(`cannot read ${path}: ${error.message}`);
	}
}

/**
 * Resolve the harness configuration.
 *
 * Missing keys are filled from `CONFIG_DEFAULTS` rather than being `undefined`
 * at every call site, which is what made 22 keys "exist but do nothing" —
 * a reader could not tell whether a key was optional or simply unimplemented.
 */
export function loadConfig(root = HARNESS_ROOT) {
	const configPath = join(root, '.agents/config.json');
	if (!existsSync(configPath)) throw new Error(`DeepLearn config not found: ${configPath}`);
	const declared = readJson(configPath);
	const merged = {
		...CONFIG_DEFAULTS,
		...declared,
		validation: { ...CONFIG_DEFAULTS.validation, ...(declared.validation || {}) },
		pagePlanning: { ...CONFIG_DEFAULTS.pagePlanning, ...(declared.pagePlanning || {}) },
	};
	// `configPath` is runtime metadata, not a declared setting. Attaching it to
	// the config object would make the config-consumer scan report a key the
	// author never wrote.
	Object.defineProperty(merged, 'configPath', { value: configPath, enumerable: false });
	return merged;
}

/** Resolve a harness-relative config path to an absolute one. */
export function harnessPath(root, config, key, fallback) {
	const value = config[key] || fallback;
	return resolve(root, value);
}

/** Recursively list files below `path`. Returns `[]` when `path` is absent. */
export function walkFiles(path) {
	if (!existsSync(path)) return [];
	const files = [];
	for (const entry of readdirSync(path, { withFileTypes: true })) {
		const child = join(path, entry.name);
		if (entry.isDirectory()) files.push(...walkFiles(child));
		else if (entry.isFile()) files.push(child);
	}
	return files;
}

/** Repository-relative path with forward slashes, for stable messages. */
export function relPath(root, file) {
	return relative(root, file).split(sep).join('/');
}

/** Markdown files only, which is what every research scan consumes. */
export function markdownFilesUnder(dir) {
	return walkFiles(dir).filter((file) => extname(file).toLowerCase() === '.md');
}

/**
 * Directory names inside a research package that are agent output rather than
 * research source.
 *
 * `review-learning` writes `docs/<slug>/review/review.md`. Treating that as a
 * research heading source made the visual coverage validator demand a coverage
 * row for every heading in the review report, so auditing a topic silently
 * invalidated its coverage map. Exclusion is keyed by directory name so it
 * cannot silently swallow a real research directory.
 */
export const RESEARCH_OUTPUT_DIRECTORIES = new Set(['review']);

/** True when a research-relative path is agent output, not research source. */
export function isResearchOutputPath(relativePath) {
	const segments = String(relativePath).split('/');
	return segments.slice(0, -1).some((segment) => RESEARCH_OUTPUT_DIRECTORIES.has(segment));
}

/**
 * Research files that participate in coverage validation.
 *
 * Excluded:
 *   - anything under an agent-output directory (`review/`)
 *   - the learning design file itself, which is a planning artifact rather than
 *     teaching content. Counting its headings made every published topic fail
 *     coverage until a row was written for "## Objectives".
 *
 * @param learningDesignFile the design file's basename, from config
 */
export function researchSourceFiles(researchDir, learningDesignFile = 'learning.md') {
	return markdownFilesUnder(researchDir).filter((file) => {
		const relativePath = relative(researchDir, file).split(sep).join('/');
		if (isResearchOutputPath(relativePath)) return false;
		return relativePath !== learningDesignFile;
	});
}

/** Every research topic: a directory under `docs/` containing a README. */
export function topicRecords(docsDir) {
	if (!existsSync(docsDir)) return [];
	const records = [];
	for (const entry of readdirSync(docsDir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const readme = join(docsDir, entry.name, 'README.md');
		if (!existsSync(readme)) continue;
		const metadata = readFrontmatter(readFileSync(readme, 'utf8'), { file: readme });
		records.push({
			slug: entry.name,
			title: metadata.title || entry.name,
			mode: metadata.mode || 'unknown',
			status: metadata.status || 'unknown',
			updated: metadata.updated || 'unknown',
			metadata,
		});
	}
	return records.sort((a, b) => a.title.localeCompare(b.title));
}

/** Topic slugs that have a research README. */
export function topicSlugs(docsDir) {
	return topicRecords(docsDir).map((record) => record.slug);
}

/** Lowercase alphanumeric key for duplicate-title detection. */
export function normalizedTitle(value) {
	return String(value).normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Slugify a free-text topic name. */
export function slugify(value) {
	return String(value)
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-{2,}/g, '-');
}

/** Reject a slug that could escape `docs/` or produce an unusable route. */
export function isSafeSlug(slug) {
	return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(slug));
}

/** Replace `{{TOKEN}}` placeholders in a template. */
export function renderTemplate(content, values) {
	return content.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => values[key] ?? match);
}

/**
 * Acknowledge exceptions.
 *
 * `docs/model-context-protocol/` was deleted as pre-existing user work, but two
 * dependents survived: a published learning page and a 15KB coverage map. The
 * harness reported both as hard errors forever, which trains the agent that a
 * failing gate is normal. An exception records the decision, its reason, and
 * its review date instead of deleting content the audit was not authorised to
 * remove.
 */
export function loadExceptions(root, config) {
	const path = harnessPath(root, config, 'exceptionsFile', '.agents/state/exceptions.json');
	if (!existsSync(path)) return { path, entries: [] };
	try {
		const data = readJson(path);
		return { path, entries: Array.isArray(data.exceptions) ? data.exceptions : [] };
	} catch {
		return { path, entries: [] };
	}
}

/**
 * Find the acknowledged exception covering a target path.
 *
 * An entry lists several `targets`, because one decision (for example "the MCP
 * research package was deliberately removed") usually orphans more than one
 * artifact.
 */
export function exceptionFor(exceptions, target) {
	return (
		exceptions.entries.find((entry) =>
			(entry.targets || []).some((candidate) => candidate === target),
		) || undefined
	);
}

/** Write an object as pretty JSON, creating parent directories. */
export function writeJson(path, value) {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

/**
 * Re-exported vocabularies and sets so a consumer needs one import.
 *
 * `deep-learn.mjs` previously imported `LEARNING_LEVELS`, `PAGE_KINDS`, and
 * `TAXONOMY_FACETS` and never used any of them, which read as "these enums are
 * checked here" to anyone auditing the file.
 */
export {
	INSPECTION_STATUS_SET,
	LEARNING_LEVELS,
	PAGE_KINDS,
	PUBLICATION_STATES,
	RESEARCH_MODE_SET,
	RESEARCH_STATUSES,
	RESEARCH_STATUS_SET,
	SOURCE_TYPE_SET,
	STABLE_ID,
	TAXONOMY_FACETS,
};