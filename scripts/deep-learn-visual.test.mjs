import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { publishedHref } from '../src/markdown/rewrite-local-markdown-links.mjs';
import globMatcher, { isMatch } from '../src/shims/browser-glob.mjs';
import { headingText, createSlugger, slugHeading } from '../.agents/lib/anchors.mjs';
import { headings, localLinkTarget, unclosedFence } from '../.agents/lib/markdown.mjs';
import { LEARNING_LEVELS, PAGE_KINDS, TAXONOMY_FACETS } from '../.agents/contracts/learning-contract.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(repositoryRoot, 'scripts/deep-learn-visual.mjs');

function run(root, ...args) {
	return spawnSync(process.execPath, [cli, ...args, '--root', root], { encoding: 'utf8' });
}

function fixture() {
	const root = mkdtempSync(join(tmpdir(), 'deep-learn-visual-test-'));
	mkdirSync(join(root, '.agents/coverage'), { recursive: true });
	cpSync(join(repositoryRoot, '.agents/config.json'), join(root, '.agents/config.json'));
	cpSync(join(repositoryRoot, '.agents/registry'), join(root, '.agents/registry'), { recursive: true });
	mkdirSync(join(root, 'docs/sample-topic'), { recursive: true });
	mkdirSync(join(root, 'src/content/docs/sample'), { recursive: true });
	mkdirSync(join(root, 'src/components/learning'), { recursive: true });
	writeFileSync(
		join(root, 'docs/sample-topic/README.md'),
		`---\ntitle: Sample\nslug: sample-topic\nstatus: validated\n---\n\n# Sample\n\n## Mechanism\n\nSource truth.\n`,
	);
	writeFileSync(
		join(root, 'src/content/docs/sample/index.mdx'),
		`---\ntitle: Sample\nlearning:\n  id: sample-topic\n  category: Test\n  difficulty: beginner\n  researchSlug: sample-topic\n  updated: 2026-09-21\n---\n\n## Mechanism\n\n[Research](/research/sample-topic/)\n`,
	);
	writeFileSync(
		join(root, '.agents/coverage/sample-topic.md'),
		`| Source file | Source section | Destination file | Destination anchor | Status | Transformation |\n| --- | --- | --- | --- | --- | --- |\n| README.md | Mechanism | src/content/docs/sample/index.mdx | #mechanism | MAPPED | Taught directly. |\n`,
	);
	return root;
}

function writeResearch(root, slug, sections) {
	mkdirSync(join(root, 'docs', slug), { recursive: true });
	const body = sections.map((section) => `## ${section}\n\nBody for ${section}.\n`).join('\n');
	writeFileSync(
		join(root, 'docs', slug, 'README.md'),
		`---\ntitle: ${slug}\nslug: ${slug}\nstatus: validated\n---\n\n# ${slug}\n\n${body}`,
	);
}

function writePage(root, relPath, frontmatter, body = '## Section\n\nText.\n') {
	const target = join(root, 'src/content/docs', relPath);
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, `---\ntitle: Page\n${frontmatter}\n---\n\n${body}`);
	return target;
}

/** A topic split into one overview plus N focused child pages. */
function multiPageFixture(childCount = 4) {
	const root = fixture();
	const slug = 'deep-topic';
	// One research section per page: the overview plus one per child.
	const sections = ['Foundations', 'Lifecycle', 'Reliability', 'Alternatives', 'Practice', 'Review'].slice(0, childCount + 1);
	writeResearch(root, slug, sections);
	rmSync(join(root, 'docs/sample-topic'), { recursive: true, force: true });
	rmSync(join(root, 'src/content/docs/sample'), { recursive: true, force: true });
	rmSync(join(root, '.agents/coverage/sample-topic.md'), { force: true });

	writePage(
		root,
		'ai/deep-topic/index.mdx',
		[
			'learning:',
			'  id: deep-topic',
			'  topicId: deep-topic',
			'  kind: overview',
			'  order: 0',
			'  category: AI Engineering',
			'  difficulty: intermediate',
			'  researchSlug: deep-topic',
			'  updated: 2026-09-21',
			'  domainIds: [ai-engineering]',
			'  fieldIds: [agent-integration]',
			'  skillIds: [api-design]',
			'  objectiveIds: [deep.explain-boundary]',
			'  assessmentIds: [deep.boundary-recall]',
		].join('\n'),
		`## Foundations\n\nOverview text.\n\n[Research](/research/${slug}/)\n`,
	);

	const kinds = ['module', 'module', 'deep-dive', 'practice', 'review'];
	for (let index = 0; index < childCount; index += 1) {
		writePage(
			root,
			`ai/deep-topic/${index}-${kinds[index]}.mdx`,
			[
				'learning:',
				`  id: deep-topic-${index}`,
				'  topicId: deep-topic',
				`  kind: ${kinds[index]}`,
				`  order: ${index + 1}`,
				'  category: AI Engineering',
				'  difficulty: intermediate',
				`  researchSlug: ${slug}`,
				'  updated: 2026-09-21',
				`  objectiveIds: [deep.objective-${index}]`,
				`  assessmentIds: [deep.assessment-${index}]`,
			].join('\n'),
			`## ${kinds[index]} detail\n\nChild page body.\n\n[Research](/research/${slug}/)\n`,
		);
	}
	return root;
}

test('inspects and validates a mapped topic', (t) => {
	const root = fixture();
	t.after(() => rmSync(root, { recursive: true, force: true }));

	const inspected = run(root, 'inspect', 'sample-topic');
	assert.equal(inspected.status, 0, inspected.stderr);
	assert.match(inspected.stdout, /Level-two source sections: 1/);

	const validated = run(root, 'validate', 'sample-topic', '--strict');
	assert.equal(validated.status, 0, validated.stderr);
	assert.match(validated.stdout, /1 source sections, 1 coverage rows/);
});

test('fails when research coverage becomes stale', (t) => {
	const root = fixture();
	t.after(() => rmSync(root, { recursive: true, force: true }));

	const readme = join(root, 'docs/sample-topic/README.md');
	writeFileSync(readme, `${readFileSync(readme, 'utf8')}\n## Failure mode\n\nNew finding.\n`);
	const result = run(root, 'coverage', 'sample-topic', '--strict');
	assert.equal(result.status, 1);
	assert.match(result.stderr, /unmapped source section: README\.md::Failure mode/);
});

test('fails duplicate stable page IDs', (t) => {
	const root = fixture();
	t.after(() => rmSync(root, { recursive: true, force: true }));

	mkdirSync(join(root, 'src/content/docs/duplicate'), { recursive: true });
	writeFileSync(
		join(root, 'src/content/docs/duplicate/index.mdx'),
		`---\ntitle: Duplicate\nlearning:\n  id: sample-topic\n  topicId: another-topic\n  researchSlug: sample-topic\n---\n`,
	);
	const result = run(root, 'validate', 'sample-topic', '--strict');
	assert.equal(result.status, 1);
	assert.match(result.stderr, /duplicate learning\.pageId "sample-topic"/);
});

test('fails pages that disagree about topicId', (t) => {
	const root = fixture();
	t.after(() => rmSync(root, { recursive: true, force: true }));

	writePage(
		root,
		'sample/child.mdx',
		[
			'learning:',
			'  id: sample-child',
			'  topicId: another-topic',
			'  kind: module',
			'  category: Test',
			'  difficulty: beginner',
			'  researchSlug: sample-topic',
			'  updated: 2026-09-21',
			'  objectiveIds: [sample.objective]',
		].join('\n'),
		'## Child\n\n[Research](/research/sample-topic/)\n',
	);

	const result = run(root, 'validate', 'sample-topic', '--strict');
	assert.equal(result.status, 1);
	assert.match(result.stderr, /disagree about topicId/);
});

test('rejects taxonomy IDs that are absent from the registry', (t) => {
	const root = fixture();
	t.after(() => rmSync(root, { recursive: true, force: true }));

	const pagePath = join(root, 'src/content/docs/sample/index.mdx');
	const page = readFileSync(pagePath, 'utf8').replace(
		'  researchSlug: sample-topic',
		'  researchSlug: sample-topic\n  domainIds: [unknown-domain]',
	);
	writeFileSync(pagePath, page);

	const result = run(root, 'validate', 'sample-topic', '--strict');
	assert.equal(result.status, 1);
	assert.match(result.stderr, /unknown taxonomy ID "unknown-domain"/);
});

test('a legacy single-page topic stays valid without edits', (t) => {
	const root = fixture();
	t.after(() => rmSync(root, { recursive: true, force: true }));

	const result = run(root, 'validate', 'sample-topic', '--strict');
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /1 source sections, 1 coverage rows/);
});

test('a multi-page topic with one overview is valid', (t) => {
	const root = multiPageFixture(4);
	t.after(() => rmSync(root, { recursive: true, force: true }));

	// No coverage map yet: report the missing map, but the page contract holds.
	const result = run(root, 'validate', 'deep-topic', '--strict');
	const contractErrors = result.stderr
		.split('\n')
		.filter((line) => line.startsWith('Error:') && !line.includes('coverage map is missing'));
	assert.deepEqual(contractErrors, [], `unexpected contract errors:\n${contractErrors.join('\n')}`);

	const inspected = run(root, 'inspect', 'deep-topic');
	assert.equal(inspected.status, 0, inspected.stderr);
	assert.match(inspected.stdout, /Learning pages: 5/);
	assert.match(inspected.stdout, /Publication state: published/);
	assert.match(inspected.stdout, /pageId: deep-topic, overview/);
	assert.match(inspected.stdout, /pageId: deep-topic-2, deep-dive/);
	assert.match(inspected.stdout, /pageId: deep-topic-3, practice/);
});

test('a multi-page topic becomes fully green once coverage exists', (t) => {
	const root = multiPageFixture(4);
	t.after(() => rmSync(root, { recursive: true, force: true }));

	const rows = [
		['Foundations', 'src/content/docs/ai/deep-topic/index.mdx', '#foundations'],
		['Lifecycle', 'src/content/docs/ai/deep-topic/0-module.mdx', '#module-detail'],
		['Reliability', 'src/content/docs/ai/deep-topic/1-module.mdx', '#module-detail'],
		['Alternatives', 'src/content/docs/ai/deep-topic/2-deep-dive.mdx', '#deep-dive-detail'],
		['Practice', 'src/content/docs/ai/deep-topic/3-practice.mdx', '#practice-detail'],
	]
		.map(([section, file, anchor]) => `| README.md | ${section} | ${file} | ${anchor} | MAPPED | Taught directly. |`)
		.join('\n');
	writeFileSync(
		join(root, '.agents/coverage/deep-topic.md'),
		`| Source file | Source section | Destination file | Destination anchor | Status | Transformation |\n| --- | --- | --- | --- | --- | --- |\n${rows}\n`,
	);

	const result = run(root, 'validate', 'deep-topic', '--strict');
	assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
	assert.match(result.stdout, /Learning validation passed for 1 topic/);
});

test('fails a topic with no overview page', (t) => {
	const root = multiPageFixture(2);
	t.after(() => rmSync(root, { recursive: true, force: true }));

	writePage(
		root,
		'ai/deep-topic/only-child.mdx',
		[
			'learning:',
			'  id: only-child',
			'  topicId: deep-topic',
			'  kind: module',
			'  order: 9',
			'  category: AI Engineering',
			'  difficulty: intermediate',
			'  researchSlug: deep-topic',
			'  updated: 2026-09-21',
			'  objectiveIds: [deep.only]',
		].join('\n'),
	);
	// Remove the overview.
	rmSync(join(root, 'src/content/docs/ai/deep-topic/index.mdx'), { force: true });

	const result = run(root, 'validate', 'deep-topic', '--strict');
	assert.equal(result.status, 1);
	assert.match(result.stderr, /no overview page/);
});

test('fails a topic with two overview pages', (t) => {
	const root = multiPageFixture(2);
	t.after(() => rmSync(root, { recursive: true, force: true }));

	writePage(
		root,
		'ai/deep-topic/second-overview.mdx',
		[
			'learning:',
			'  id: second-overview',
			'  topicId: deep-topic',
			'  kind: overview',
			'  order: 7',
			'  category: AI Engineering',
			'  difficulty: intermediate',
			'  researchSlug: deep-topic',
			'  updated: 2026-09-21',
		].join('\n'),
	);

	const result = run(root, 'validate', 'deep-topic', '--strict');
	assert.equal(result.status, 1);
	assert.match(result.stderr, /2 overview pages/);
});

test('fails an orphan learning page whose research topic is missing', (t) => {
	const root = multiPageFixture(2);
	t.after(() => rmSync(root, { recursive: true, force: true }));

	rmSync(join(root, 'docs/deep-topic'), { recursive: true, force: true });

	const result = run(root, 'validate', 'deep-topic', '--strict');
	assert.equal(result.status, 1);
	assert.match(result.stderr, /orphan learning page/);
});

test('focused validation ignores unrelated orphan topics', (t) => {
	const root = fixture();
	t.after(() => rmSync(root, { recursive: true, force: true }));

	writePage(
		root,
		'orphan/index.mdx',
		[
			'learning:',
			'  id: orphan-topic',
			'  topicId: orphan-topic',
			'  kind: overview',
			'  category: Test',
			'  difficulty: beginner',
			'  researchSlug: missing-topic',
			'  updated: 2026-09-21',
		].join('\n'),
	);

	const focused = run(root, 'validate', 'sample-topic', '--strict');
	assert.equal(focused.status, 0, `${focused.stdout}\n${focused.stderr}`);

	const all = run(root, 'validate', '--all', '--strict');
	assert.equal(all.status, 1);
	assert.match(all.stderr, /orphan learning page/);
});

test('a child page without objectives is rejected', (t) => {
	const root = multiPageFixture(2);
	t.after(() => rmSync(root, { recursive: true, force: true }));

	writePage(
		root,
		'ai/deep-topic/aimless.mdx',
		[
			'learning:',
			'  id: aimless',
			'  topicId: deep-topic',
			'  kind: module',
			'  order: 8',
			'  category: AI Engineering',
			'  difficulty: intermediate',
			'  researchSlug: deep-topic',
			'  updated: 2026-09-21',
		].join('\n'),
	);

	const result = run(root, 'validate', 'deep-topic', '--strict');
	assert.equal(result.status, 1);
	assert.match(result.stderr, /requires at least one learning\.objectiveIds entry/);
});

test('research-only is a legal state, not a validation failure', (t) => {
	const root = fixture();
	t.after(() => rmSync(root, { recursive: true, force: true }));

	rmSync(join(root, 'src/content/docs/sample'), { recursive: true, force: true });
	rmSync(join(root, '.agents/coverage/sample-topic.md'), { force: true });

	const result = run(root, 'validate', 'sample-topic', '--strict');
	assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
	assert.match(result.stdout, /publication state is research-only/);
	assert.match(result.stdout, /coverage map is not required until the topic is published/);
	assert.match(result.stdout, /1 research-only: sample-topic/);
});

test('rejects a taxonomy facet that is not a stable ID', (t) => {
	const root = multiPageFixture(2);
	t.after(() => rmSync(root, { recursive: true, force: true }));

	writePage(
		root,
		'ai/deep-topic/bad-taxonomy.mdx',
		[
			'learning:',
			'  id: bad-taxonomy',
			'  topicId: deep-topic',
			'  kind: module',
			'  order: 6',
			'  category: AI Engineering',
			'  difficulty: intermediate',
			'  researchSlug: deep-topic',
			'  updated: 2026-09-21',
			'  domainIds: [AI Engineering]',
			'  objectiveIds: [deep.taxonomy]',
		].join('\n'),
	);

	const result = run(root, 'validate', 'deep-topic', '--strict');
	assert.equal(result.status, 1);
	assert.match(result.stderr, /domainIds must use stable kebab-case IDs/);
});

test('validate --json emits machine-readable results', (t) => {
	const root = fixture();
	t.after(() => rmSync(root, { recursive: true, force: true }));

	const result = run(root, 'validate', 'sample-topic', '--strict', '--json');
	assert.equal(result.status, 0, result.stderr);
	const parsed = JSON.parse(result.stdout);
	assert.equal(parsed.ok, true);
	assert.equal(parsed.summary.sourceSections, 1);
	assert.equal(parsed.summary.coverageRows, 1);
	assert.equal(parsed.topics['sample-topic'], 'published');
});

test('publishes relative Markdown links as extensionless Astro routes', () => {
	assert.equal(publishedHref('implementation.md'), 'implementation/');
	assert.equal(publishedHref('../README.md#overview'), '../#overview');
	assert.equal(publishedHref('https://example.com/guide.md'), 'https://example.com/guide.md');
	assert.equal(publishedHref('#local-section'), '#local-section');
});

test('browser-safe route globs cover plugin inclusion and exclusion patterns', () => {
	assert.equal(isMatch('ai-engineering/model-context-protocol', '**/*'), true);
	assert.equal(isMatch('/research/model-context-protocol/', '/research/**/*'), true);
	assert.equal(isMatch('/tools/git/', '/tags/**/*'), false);
	assert.equal(globMatcher([])('/tools/git/'), false);
});

// --- shared library behaviour -------------------------------------------------

test('heading anchors match the real build, including em dashes', () => {
	// Verified against this repository's own built output:
	//   built id  module-1--why-the-current-harness-fights-the-learner
	const slugger = createSlugger();
	assert.equal(
		slugHeading(slugger, headingText('Module 1 — Why the current harness fights the learner')),
		'#module-1--why-the-current-harness-fights-the-learner',
	);
	assert.equal(slugHeading(createSlugger(), headingText('C++ & Rust')), '#c--rust');
	assert.equal(slugHeading(createSlugger(), headingText('1. Install & configure')), '#1-install--configure');
});

test('repeated headings receive distinct suffixed anchors', () => {
	const found = headings('## Overview\n\nOne.\n\n## Overview\n\nTwo.\n', { min: 2, max: 6 });
	assert.deepEqual(
		found.map((heading) => heading.anchor),
		['#overview', '#overview-1'],
	);
});

test('headings inside fenced code blocks are not headings', () => {
	const content = ['# Real', '', '```bash', '# not a heading', '## also not', '```', '', '## Actual'].join('\n');
	const found = headings(content, { min: 2, max: 6 });
	assert.deepEqual(
		found.map((heading) => heading.text),
		['Actual'],
	);
});

test('an unclosed code fence is detected', () => {
	assert.ok(unclosedFence('```js\nconst a = 1;\n'), 'a fence with no closer must be reported');
	assert.equal(unclosedFence('```js\nconst a = 1;\n```\n'), undefined, 'a closed fence must not be reported');
	assert.equal(unclosedFence('text with ``` inline ``` markers\n'), undefined, 'inline code is not a fence');
	assert.equal(unclosedFence('no fences here\n'), undefined);
});

test('local link targets ignore external and anchor-only links', () => {
	assert.equal(localLinkTarget('implementation.md'), 'implementation.md');
	assert.equal(localLinkTarget('../README.md#overview'), '../README.md');
	assert.equal(localLinkTarget('#local'), undefined);
	assert.equal(localLinkTarget('https://example.com'), undefined);
	assert.equal(localLinkTarget('//cdn.example.com/a.js'), undefined);
});

test('the Astro schema and the harness share one vocabulary', async () => {
	const schema = readFileSync(join(repositoryRoot, 'src/content.config.ts'), 'utf8');
	// The schema must import the canonical vocabularies rather than redeclare them.
	assert.match(schema, /import \{ LEARNING_LEVELS, PAGE_KINDS, TAXONOMY_FACETS \} from '\.\.\/\.agents\/contracts\/learning-contract\.mjs'/);
	assert.doesNotMatch(schema, /enumFrom\(\[/);

	// The legacy mirror of the access-level vocabulary must not drift.
	const agentConfig = JSON.parse(readFileSync(join(repositoryRoot, '.agents/config.json'), 'utf8'));
	assert.deepEqual(agentConfig.requiredLearningLevels, LEARNING_LEVELS);
	assert.deepEqual(PAGE_KINDS, ['overview', 'module', 'deep-dive', 'practice', 'review']);
	assert.deepEqual(TAXONOMY_FACETS, ['domainIds', 'fieldIds', 'skillIds', 'toolIds']);
});
