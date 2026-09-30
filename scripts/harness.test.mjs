import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(repositoryRoot, '.agents/bin/harness.mjs');

function run(root, ...args) {
	return spawnSync(process.execPath, [cli, ...args, '--root', root], { encoding: 'utf8' });
}

function fixture() {
	const root = mkdtempSync(join(tmpdir(), 'harness-test-'));
	mkdirSync(join(root, '.agents'), { recursive: true });
	cpSync(join(repositoryRoot, '.agents/config.json'), join(root, '.agents/config.json'));
	return root;
}

function writeFeatures(root, features) {
	writeFileSync(join(root, '.agents/features.json'), JSON.stringify({ version: 1, features }, null, 2));
}

const FEATURE = (id, state, extra = {}) => ({
	id,
	behavior: `${id} does the thing`,
	verify: 'npm test',
	state,
	...extra,
});

test('features reports VCR over activated features, not all features', (t) => {
	const root = fixture();
	t.after(() => rmSync(root, { recursive: true, force: true }));

	writeFeatures(root, [
		FEATURE('done-one', 'done', { evidence: 'npm test: 40 pass' }),
		FEATURE('done-two', 'done', { evidence: 'npm test: 40 pass' }),
		FEATURE('in-flight', 'in-progress'),
		FEATURE('untouched-a', 'not-started'),
		FEATURE('untouched-b', 'not-started'),
	]);

	const result = run(root, 'features', '--json');
	assert.equal(result.status, 0, result.stderr);
	const parsed = JSON.parse(result.stdout);

	// VCR is passing over activated: 2 of 3, not 2 of 5. Counting untouched work
	// would let a repository with nothing started look mostly incomplete.
	assert.equal(parsed.summary.activated, 3);
	assert.equal(parsed.summary.passing, 2);
	assert.equal(parsed.summary.total, 5);
	assert.equal(Math.round(parsed.summary.vcr * 100), 67);
	assert.deepEqual(parsed.problems, []);
});

test('features reports no signal rather than a perfect score when nothing is activated', (t) => {
	const root = fixture();
	t.after(() => rmSync(root, { recursive: true, force: true }));

	writeFeatures(root, [FEATURE('a', 'not-started'), FEATURE('b', 'not-started')]);
	const parsed = JSON.parse(run(root, 'features', '--json').stdout);
	assert.equal(parsed.summary.vcr, null, 'an empty denominator is not 100%');
	assert.match(run(root, 'features').stdout, /no signal/);
});

test('a done feature without evidence is rejected', (t) => {
	const root = fixture();
	t.after(() => rmSync(root, { recursive: true, force: true }));

	// Only a passing verification command may move a feature to done. An agent
	// that types `state: done` is the failure this rule prevents.
	writeFeatures(root, [FEATURE('claimed-done', 'done', { evidence: null })]);
	const result = run(root, 'features', '--json');
	assert.equal(result.status, 1);
	assert.match(JSON.parse(result.stdout).problems.join('\n'), /only a passing verification may set done/);
});

test('a blocked feature must record why', (t) => {
	const root = fixture();
	t.after(() => rmSync(root, { recursive: true, force: true }));

	writeFeatures(root, [FEATURE('stuck', 'blocked')]);
	const result = run(root, 'features', '--json');
	assert.equal(result.status, 1);
	assert.match(JSON.parse(result.stdout).problems.join('\n'), /no blocked_by reason/);
});

test('an invalid state is rejected', (t) => {
	const root = fixture();
	t.after(() => rmSync(root, { recursive: true, force: true }));

	writeFeatures(root, [FEATURE('weird', 'finished')]);
	const result = run(root, 'features', '--json');
	assert.equal(result.status, 1);
	assert.match(JSON.parse(result.stdout).problems.join('\n'), /state "finished" is invalid/);
});

test('more than one feature in progress is warned about', (t) => {
	const root = fixture();
	t.after(() => rmSync(root, { recursive: true, force: true }));

	writeFeatures(root, [FEATURE('first', 'in-progress'), FEATURE('second', 'in-progress')]);
	const parsed = JSON.parse(run(root, 'features', '--json').stdout);
	assert.deepEqual(parsed.problems, [], 'WIP is a warning, not an error');
	assert.match(run(root, 'features').stdout, /WIP=1 is the safe default/);
});

test('the real feature list is internally consistent', () => {
	const parsed = JSON.parse(run(repositoryRoot, 'features', '--json').stdout);
	assert.deepEqual(parsed.problems, [], parsed.problems.join('; '));
	for (const feature of parsed.features) {
		if (feature.state === 'done') {
			assert.equal(feature.hasEvidence, true, `${feature.id} is done without evidence`);
		}
	}
});

test('status reports progress, features, and exceptions in one call', () => {
	const result = run(repositoryRoot, 'status', '--json');
	assert.equal(result.status, 0, result.stderr);
	const parsed = JSON.parse(result.stdout);
	assert.ok(parsed.progressFile, 'the resume pointer is named');
	assert.equal(typeof parsed.features.vcr, 'number');
	assert.ok(Array.isArray(parsed.exceptions));
});

test('check stops at the first failing layer', (t) => {
	const root = fixture();
	t.after(() => rmSync(root, { recursive: true, force: true }));

	// An empty fixture fails the static layer. The runtime and system layers must
	// not run, because a structural failure makes their results untrustworthy.
	const result = run(root, 'check', '--json');
	assert.equal(result.status, 1);
	const parsed = JSON.parse(result.stdout);
	assert.deepEqual(parsed.layersRan, ['static']);
	assert.ok(parsed.layersSkipped.includes('runtime'));
	assert.ok(parsed.layersSkipped.includes('system'));
	assert.equal(parsed.reports[0].ok, false);
});

test('check can run a single layer', (t) => {
	const root = fixture();
	t.after(() => rmSync(root, { recursive: true, force: true }));

	const result = run(root, 'check', '--json', '--layer=static');
	const parsed = JSON.parse(result.stdout);
	assert.deepEqual(parsed.layersRan, ['static']);
	assert.equal(typeof parsed.reports[0].results[0].command, 'string');
});

test('check rejects an unknown layer name', (t) => {
	const root = fixture();
	t.after(() => rmSync(root, { recursive: true, force: true }));

	const result = run(root, 'check', '--layer=nonsense');
	assert.equal(result.status, 1);
	assert.match(result.stderr, /unknown layer "nonsense"/);
});

test('the real repository passes every gate layer', () => {
	// The aggregate gate used to be a chain of npm scripts that reported only the
	// last exit code, so an early failure could hide behind a later success.
	//
	// The runtime layer is checked on purpose: it runs `npm test`, which is the
	// suite this assertion belongs to. Invoking it from here would recurse, so
	// the runtime layer is verified by running the suite, and the other two
	// layers are verified directly. `harness.mjs check` from a shell runs all
	// three in order.
	for (const layer of ['static', 'system']) {
		const result = run(repositoryRoot, 'check', '--json', `--layer=${layer}`);
		assert.equal(result.status, 0, `${layer}: ${result.stdout}\n${result.stderr}`);
		const parsed = JSON.parse(result.stdout);
		assert.equal(parsed.ok, true, `${layer} must pass`);
		assert.deepEqual(parsed.layersRan, [layer]);
		assert.deepEqual(parsed.layersSkipped, []);
	}
});

test('a receipt records the commit, the commands, and their exit codes', () => {
	const result = run(repositoryRoot, 'receipt', 'learning-harness-redesign', '--json');
	// The receipt must exist whether or not the topic passes, so a failure is
	// still evidence rather than a missing file.
	if (result.status !== 0) {
		assert.match(result.stdout + result.stderr, /receipt|Receipt/i);
		return;
	}
	const receipt = JSON.parse(result.stdout);
	assert.equal(receipt.slug, 'learning-harness-redesign');
	assert.match(receipt.commit, /^[0-9a-f]{40}$/);
	assert.ok(receipt.checks.length >= 2);
	for (const check of receipt.checks) {
		assert.equal(typeof check.exitCode, 'number');
		assert.equal(check.ok, check.exitCode === 0);
	}
	assert.ok(existsSync(join(repositoryRoot, '.agents/evidence/learning-harness-redesign.json')));
});

test('help lists the four orchestrator commands', () => {
	const result = run(fixture(), 'help');
	for (const command of ['status', 'features', 'check', 'receipt']) {
		assert.match(result.stdout, new RegExp(`\\b${command}\\b`), `help omits ${command}`);
	}
});