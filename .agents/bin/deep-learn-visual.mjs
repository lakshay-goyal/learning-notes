#!/usr/bin/env node

/**
 * DeepLearn Visual harness: the learning-presentation layer of the repository.
 *
 * Phase 1 of the harness redesign changed the central rule of this file.
 *
 * Before:  `if (pages.length !== 1) error("expected exactly one learning page")`
 * After:   exactly one overview page, plus zero or more focused child pages,
 *          one shared `topicId`, one unique `pageId`, one unique route per page.
 *
 * Also replaced: three ad-hoc frontmatter parsers and a hand-rolled heading-anchor
 * approximation, both of which are now shared with `.agents/bin/deep-learn.mjs`
 * through `.agents/lib/`.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFrontmatter, FrontmatterError } from '../lib/frontmatter.mjs';
import { headings, relativeImports, rootRelativeRoutes } from '../lib/markdown.mjs';
import {
	resolvePage,
	routeForFile,
	validateGlobalContract,
	validatePageSet,
} from '../contracts/learning-contract.mjs';
import { readTaxonomyRegistry, validatePageTaxonomy } from '../contracts/taxonomy.mjs';

const SCRIPT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const VALID_COVERAGE_STATUSES = new Set(['MAPPED', 'INTENTIONALLY_EXCLUDED']);

/** Source sections that coverage must account for: level-two headings only. */
const SOURCE_SECTION_LEVELS = { min: 2, max: 2 };
/** Destination anchors a coverage row may target: any real heading. */
const DESTINATION_ANCHOR_LEVELS = { min: 2, max: 6 };

/** Shape returned for a page whose frontmatter could not be parsed at all. */
const EMPTY_PAGE = {
	id: undefined,
	topicId: undefined,
	pageId: undefined,
	kind: undefined,
	level: undefined,
	order: 0,
	category: undefined,
	difficulty: undefined,
	researchSlug: undefined,
	objectiveIds: [],
	assessmentIds: [],
	conceptIds: [],
	labIds: [],
	taxonomy: {},
	problems: [],
	legacy: false,
};

function fail(message, code = 1) {
	console.error(`Error: ${message}`);
	process.exit(code);
}

function takeOption(args, name) {
	const index = args.indexOf(name);
	if (index === -1) return undefined;
	const value = args[index + 1];
	if (!value || value.startsWith('--')) fail(`${name} requires a value`);
	args.splice(index, 2);
	return value;
}

function takeFlag(args, name) {
	const index = args.indexOf(name);
	if (index === -1) return false;
	args.splice(index, 1);
	return true;
}

function readJson(path) {
	try {
		return JSON.parse(readFileSync(path, 'utf8'));
	} catch (error) {
		fail(`cannot read ${path}: ${error.message}`);
	}
}

function assertSafeSlug(slug) {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
		fail(`invalid topic slug "${slug}"; use lowercase letters, digits, and single hyphens`);
	}
}

function assertInside(parent, child) {
	const rel = relative(resolve(parent), resolve(child));
	if (rel === '' || rel === '..' || rel.startsWith(`..${sep}`) || resolve(rel) === rel) {
		fail(`unsafe path outside ${parent}: ${child}`);
	}
}

function walkFiles(path) {
	if (!existsSync(path)) return [];
	const files = [];
	for (const entry of readdirSync(path, { withFileTypes: true })) {
		const child = join(path, entry.name);
		if (entry.isDirectory()) files.push(...walkFiles(child));
		else if (entry.isFile()) files.push(child);
	}
	return files;
}

function topicSlugs(root, config) {
	const researchDir = resolve(root, config.researchDirectory);
	if (!existsSync(researchDir)) return [];
	return readdirSync(researchDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && existsSync(join(researchDir, entry.name, 'README.md')))
		.map((entry) => entry.name)
		.sort();
}

/**
 * Every learning page that declares a `learning` block, resolved against the
 * canonical contract. Pages that fail to parse are reported, not skipped.
 */
function learningPages(root, config) {
	const learningDir = resolve(root, config.learningDirectory);
	const pages = [];
	for (const file of walkFiles(learningDir)) {
		if (!['.md', '.mdx'].includes(extname(file).toLowerCase())) continue;
		const content = readFileSync(file, 'utf8');
		let data;
		try {
			data = readFrontmatter(content, { file });
		} catch (error) {
			if (!(error instanceof FrontmatterError)) throw error;
			pages.push({ file, content, parseError: error.message, ...EMPTY_PAGE });
			continue;
		}
		if (!data.learning) continue;
		pages.push({ file, content, parseError: undefined, ...resolvePage({ file, learning: data.learning }) });
	}
	return pages;
}

/** file -> published route, for every learning page. */
function pageRoutes(root, config, pages) {
	const learningDir = resolve(root, config.learningDirectory);
	return new Map(pages.map((page) => [page.file, routeForFile(learningDir, page.file)]));
}

function publicationState(pages) {
	if (pages.length === 0) return 'research-only';
	return 'published';
}

function parseCoverage(content) {
	const rows = [];
	for (const line of content.split(/\r?\n/)) {
		if (!line.startsWith('|')) continue;
		const cells = line.slice(1, -1).split('|').map((cell) => cell.trim());
		if (cells.length !== 6 || cells[0] === 'Source file' || /^-+$/.test(cells[0])) continue;
		rows.push({
			sourceFile: cells[0].replaceAll('`', ''),
			sourceSection: cells[1].replaceAll('`', ''),
			destinationFile: cells[2].replaceAll('`', ''),
			destinationAnchor: cells[3].replaceAll('`', ''),
			status: cells[4].replaceAll('`', ''),
			note: cells[5],
		});
	}
	return rows;
}

function routeExists(root, route) {
	const clean = route.split(/[?#]/)[0];
	if (clean === '/') return existsSync(join(root, 'src/content/docs/index.mdx')) || existsSync(join(root, 'src/content/docs/index.md'));
	if (clean.startsWith('/research/')) {
		const parts = clean.replace(/^\/research\//, '').replace(/\/$/, '').split('/').filter(Boolean);
		const [topic, ...rest] = parts;
		if (!topic) return false;
		const target = rest.length ? join(root, 'docs', topic, `${rest.join('/')}.md`) : join(root, 'docs', topic, 'README.md');
		return existsSync(target);
	}
	const rel = clean.replace(/^\//, '').replace(/\/$/, '');
	const candidates = [
		join(root, 'src/content/docs', rel, 'index.md'),
		join(root, 'src/content/docs', rel, 'index.mdx'),
		join(root, 'src/content/docs', `${rel}.md`),
		join(root, 'src/content/docs', `${rel}.mdx`),
	];
	return candidates.some(existsSync);
}

function importExists(file, specifier) {
	const base = resolve(dirname(file), specifier);
	return [base, `${base}.astro`, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.mjs`, join(base, 'index.ts')].some(existsSync);
}

function inspectTopic(root, config, slug) {
	assertSafeSlug(slug);
	const researchDir = resolve(root, config.researchDirectory, slug);
	assertInside(resolve(root, config.researchDirectory), researchDir);
	if (!existsSync(researchDir)) fail(`research topic not found: ${slug}`);
	const researchFiles = walkFiles(researchDir).filter((file) => extname(file) === '.md');
	const sourceSections = researchFiles.reduce(
		(count, file) => count + headings(readFileSync(file, 'utf8'), SOURCE_SECTION_LEVELS).length,
		0,
	);
	const pages = learningPages(root, config).filter((page) => page.researchSlug === slug);
	const coverage = resolve(root, config.coverageDirectory, `${slug}.md`);
	const visualTemplates = resolve(root, config.visualTemplateDirectory || '.agents/templates/visual');

	console.log(`Topic: ${slug}`);
	console.log(`Research files: ${researchFiles.length}`);
	console.log(`Level-two source sections: ${sourceSections}`);
	console.log(`Publication state: ${publicationState(pages)}`);
	console.log(`Learning pages: ${pages.length}`);
	for (const page of pages) {
		const role = page.kind ? `${page.kind}${page.legacy ? ' (legacy id-only)' : ''}` : 'unresolved';
		console.log(`  - ${relative(root, page.file)} (pageId: ${page.pageId ?? 'missing'}, ${role})`);
	}
	console.log(`Coverage map: ${existsSync(coverage) ? relative(root, coverage) : 'missing'}`);
	console.log(`Visual templates: ${existsSync(visualTemplates) ? relative(root, visualTemplates) : 'missing'}`);
}

function validateTopic(root, config, slug, strict) {
	assertSafeSlug(slug);
	const errors = [];
	const warnings = [];
	const info = [];
	const report = (kind, path, message) => {
		const item = `${relative(root, path)}: ${message}`;
		if (kind === 'error') errors.push(item);
		else if (kind === 'warning') warnings.push(item);
		else info.push(item);
	};

	const researchDir = resolve(root, config.researchDirectory, slug);
	const coveragePath = resolve(root, config.coverageDirectory, `${slug}.md`);
	assertInside(resolve(root, config.researchDirectory), researchDir);
	assertInside(resolve(root, config.coverageDirectory), coveragePath);

	if (!existsSync(researchDir)) {
		errors.push(`${slug}: research topic not found`);
		return { errors, warnings, info, sourceSections: 0, rows: 0, state: 'missing' };
	}

	const researchFiles = walkFiles(researchDir).filter((file) => extname(file).toLowerCase() === '.md');
	const readme = join(researchDir, 'README.md');
	if (!existsSync(readme)) {
		report('error', readme, 'research README is missing');
		return { errors, warnings, info, sourceSections: 0, rows: 0, state: 'invalid' };
	}
	let readmeFrontmatter;
	try {
		readmeFrontmatter = readFrontmatter(readFileSync(readme, 'utf8'), { file: readme });
	} catch (error) {
		if (!(error instanceof FrontmatterError)) throw error;
		report('error', readme, error.message);
		readmeFrontmatter = {};
	}
	if (strict && readmeFrontmatter.status !== 'validated') {
		report('error', readme, `strict visual validation requires validated research, found "${readmeFrontmatter.status}"`);
	}

	const pages = learningPages(root, config).filter((page) => page.researchSlug === slug);
	const taxonomyPath = resolve(root, config.taxonomyRegistry || '.agents/registry/taxonomy.json');
	let taxonomyRegistry;
	try {
		taxonomyRegistry = readTaxonomyRegistry(taxonomyPath);
	} catch (error) {
		report('error', taxonomyPath, error.message);
	}
	const state = publicationState(pages);
	const routes = pageRoutes(root, config, pages);

	// The contract replaces the old "exactly one page" rule.
	for (const problem of validatePageSet(pages, { routes })) {
		report('error', researchDir, problem);
	}
	for (const page of pages) {
		for (const problem of page.problems) report('error', page.file, problem);
		if (taxonomyRegistry) {
			for (const problem of validatePageTaxonomy(page.taxonomy, taxonomyRegistry)) {
				report('error', page.file, problem);
			}
		}
		if (page.parseError) report('error', page.file, page.parseError);
	}

	if (state === 'research-only') {
		report(
			'info',
			researchDir,
			'publication state is research-only: validated research with no learning pages yet. This is legal.',
		);
	} else {
		const overviews = pages.filter((page) => page.kind === 'overview');
		for (const page of pages) {
			if (!page.id) report('error', page.file, 'learning.id is missing');
			if (!page.content.includes(`/research/${slug}/`)) {
				report('error', page.file, `must link to /research/${slug}/`);
			}
			if (strict && /\{\{[A-Z_]+\}\}|<!--\s*TODO/i.test(page.content)) {
				report('error', page.file, 'contains unfinished template markers');
			}
			for (const specifier of relativeImports(page.content)) {
				if (!importExists(page.file, specifier)) {
					report('error', page.file, `unresolved relative import: ${specifier}`);
				}
			}
			for (const route of rootRelativeRoutes(page.content)) {
				if (!routeExists(root, route)) report('error', page.file, `unresolved internal route: ${route}`);
			}
			const declared = routes.get(page.file);
			if (declared && !routeExists(root, declared)) {
				report('error', page.file, `derived route does not resolve: ${declared}`);
			}
		}
		if (overviews.length === 1) {
			report('info', researchDir, `publication state published with ${pages.length} page(s), 1 overview.`);
		}
	}

	if (!existsSync(coveragePath)) {
		if (state === 'research-only') {
			report('info', coveragePath, 'coverage map is not required until the topic is published');
		} else {
			report('error', coveragePath, 'coverage map is missing');
			return { errors, warnings, info, sourceSections: 0, rows: 0, state };
		}
	} else {
		validateCoverage({ root, researchDir, researchFiles, coveragePath, strict, report });
	}

	const rows = existsSync(coveragePath) ? parseCoverage(readFileSync(coveragePath, 'utf8')).length : 0;
	const sourceSections = researchFiles.reduce(
		(count, file) => count + headings(readFileSync(file, 'utf8'), SOURCE_SECTION_LEVELS).length,
		0,
	);
	return { errors, warnings, info, sourceSections, rows, state };
}

function validateCoverage({ root, researchDir, researchFiles, coveragePath, strict, report }) {
	const rows = parseCoverage(readFileSync(coveragePath, 'utf8'));
	const rowKeys = new Set(rows.map((row) => `${row.sourceFile}::${row.sourceSection}`));
	const sourceKeys = [];
	for (const file of researchFiles) {
		const sourceFile = relative(researchDir, file);
		for (const heading of headings(readFileSync(file, 'utf8'), SOURCE_SECTION_LEVELS)) {
			const key = `${sourceFile}::${heading.text}`;
			sourceKeys.push(key);
			if (!rowKeys.has(key)) report('error', coveragePath, `unmapped source section: ${key}`);
		}
	}

	for (const row of rows) {
		const source = join(researchDir, row.sourceFile);
		if (!existsSync(source)) {
			report('error', coveragePath, `coverage row references missing source file: ${row.sourceFile}`);
			continue;
		}
		const sourceHeadings = headings(readFileSync(source, 'utf8'), SOURCE_SECTION_LEVELS).map((h) => h.text);
		if (!sourceHeadings.includes(row.sourceSection)) {
			report('error', coveragePath, `coverage row references missing source heading: ${row.sourceFile} :: ${row.sourceSection}`);
		}
		if (!VALID_COVERAGE_STATUSES.has(row.status)) {
			report('error', coveragePath, `invalid coverage status: ${row.status}`);
		}
		if (!row.note) {
			report('error', coveragePath, `coverage row needs a transformation/exclusion note: ${row.sourceFile} :: ${row.sourceSection}`);
		}
		if (row.status === 'MAPPED') {
			const destination = resolve(root, row.destinationFile);
			if (!existsSync(destination)) {
				report('error', coveragePath, `mapped destination file is missing: ${row.destinationFile}`);
			} else {
				// Anchors are produced by the same slugger the build uses, so a row
				// cannot validate against an anchor the published page lacks.
				const anchors = new Set(
					headings(readFileSync(destination, 'utf8'), DESTINATION_ANCHOR_LEVELS).map((heading) => heading.anchor),
				);
				if (!anchors.has(row.destinationAnchor)) {
					report('error', coveragePath, `destination anchor is missing: ${row.destinationFile}${row.destinationAnchor}`);
				}
			}
		} else if (strict && !/outside|duplicate|workflow|metadata|scope|not applicable/i.test(row.note)) {
			report('warning', coveragePath, `review exclusion rationale: ${row.sourceFile} :: ${row.sourceSection}`);
		}
	}

	for (const key of rowKeys) {
		if (!sourceKeys.includes(key)) {
			report('error', coveragePath, `coverage row has no matching level-two source heading: ${key}`);
		}
	}
}

function runValidation(root, config, slugs, strict, { json = false, allTopics = false } = {}) {
	let errorCount = 0;
	let warningCount = 0;
	let sectionCount = 0;
	let rowCount = 0;
	const report = [];
	const states = new Map();

	for (const slug of slugs) {
		const result = validateTopic(root, config, slug, strict);
		sectionCount += result.sourceSections;
		rowCount += result.rows;
		states.set(slug, result.state);
		for (const item of result.info) report.push({ level: 'info', slug, message: item });
		for (const warning of result.warnings) report.push({ level: 'warning', slug, message: warning });
		for (const error of result.errors) report.push({ level: 'error', slug, message: error });
	}

	// Site-wide invariants are checked across the requested scope. A focused
	// topic validation must not fail because an unrelated topic is orphaned;
	// `validate --all` is the explicit repository-wide gate.
	const allPages = learningPages(root, config);
	const pages = allTopics ? allPages : allPages.filter((page) => slugs.includes(page.researchSlug));
	const routes = pageRoutes(root, config, pages);
	const availableResearchSlugs = topicSlugs(root, config);
	const researchSlugs = new Set(
		allTopics ? availableResearchSlugs : availableResearchSlugs.filter((slug) => slugs.includes(slug)),
	);
	for (const problem of validateGlobalContract(pages, {
		routes,
		researchSlugs,
	})) {
		report.push({ level: 'error', slug: '*', message: problem });
	}
	errorCount += report.filter((item) => item.level === 'error').length;
	warningCount += report.filter((item) => item.level === 'warning').length;

	if (json) {
		console.log(
			JSON.stringify(
				{
					ok: errorCount === 0,
					topics: Object.fromEntries(states),
					errors: report.filter((item) => item.level === 'error'),
					warnings: report.filter((item) => item.level === 'warning'),
					info: report.filter((item) => item.level === 'info'),
					summary: { errors: errorCount, warnings: warningCount, sourceSections: sectionCount, coverageRows: rowCount },
				},
				null,
				2,
			),
		);
	} else {
		for (const item of report) {
			if (item.level === 'error') console.error(`Error: ${item.message}`);
			else if (item.level === 'warning') console.warn(`Warning: ${item.message}`);
			else console.log(`Note: ${item.message}`);
		}
		if (errorCount) {
			console.error(`Learning validation failed with ${errorCount} error(s) and ${warningCount} warning(s).`);
		} else {
			const researchOnly = [...states].filter(([, state]) => state === 'research-only').map(([slug]) => slug);
			const suffix = researchOnly.length ? ` (${researchOnly.length} research-only: ${researchOnly.join(', ')})` : '';
			console.log(
				`Learning validation passed for ${slugs.length} topic(s): ${sectionCount} source sections, ${rowCount} coverage rows, ${warningCount} warning(s)${suffix}.`,
			);
		}
	}

	if (errorCount) process.exit(1);
}

function printHelp() {
	console.log(`DeepLearn Visual harness

Usage:
  node .agents/bin/deep-learn-visual.mjs inspect <slug>
  node .agents/bin/deep-learn-visual.mjs coverage <slug> [--strict]
  node .agents/bin/deep-learn-visual.mjs validate <slug> [--strict] [--json]
  node .agents/bin/deep-learn-visual.mjs validate --all [--strict] [--json]

Page contract:
  exactly one page with learning.kind: overview
  zero or more pages with kind module | deep-dive | practice | review
  one learning.topicId shared by the topic
  one learning.pageId unique across the learning site
  one unique route per page
  taxonomy IDs must exist in .agents/registry/taxonomy.json

A focused validate <slug> scopes global ID/route checks to that topic.
Use validate --all for the site-wide gate. A legacy page that declares only
learning.id resolves to topicId = pageId = id and kind: overview, so existing
pages and routes stay valid.

The internal --root <path> option supports isolated harness tests.`);
}

const args = process.argv.slice(2);
const root = resolve(takeOption(args, '--root') || SCRIPT_ROOT);
const configPath = join(root, '.agents/config.json');
if (!existsSync(configPath)) fail(`DeepLearn Visual config not found: ${configPath}`);
const config = readJson(configPath);
const command = args.shift();

switch (command) {
	case 'inspect': {
		const slug = args.shift();
		if (!slug || args.length) fail('inspect requires exactly one topic slug');
		inspectTopic(root, config, slug);
		break;
	}
	case 'coverage': {
		const strict = takeFlag(args, '--strict');
		const slug = args.shift();
		if (!slug || args.length) fail('coverage requires exactly one topic slug');
		runValidation(root, config, [slug], strict);
		break;
	}
	case 'validate': {
		const strict = takeFlag(args, '--strict');
		const all = takeFlag(args, '--all');
		const json = takeFlag(args, '--json');
		const slug = args.shift();
		if (args.length || (all && slug) || (!all && !slug)) fail('validate requires one topic slug or --all');
		const slugs = all ? topicSlugs(root, config) : [slug];
		if (!slugs.length) fail('no research topics found');
		runValidation(root, config, slugs, strict, { json, allTopics: all });
		break;
	}
	case 'help':
	case '--help':
	case '-h':
	case undefined:
		printHelp();
		break;
	default:
		fail(`unknown command "${command}"; run with --help`);
}
