import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
	INTERVALS,
	STORAGE_KEY,
	dueTopicIds,
	rateRecall,
	readProgress,
	readTopic,
	storageAvailable,
	writeTopic,
} from '../src/components/learning/progress-store.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Minimal localStorage. Node has none, so the module is tested against one. */
function installStore(initial = {}) {
	const data = new Map(Object.entries(initial));
	globalThis.localStorage = {
		getItem: (key) => (data.has(key) ? data.get(key) : null),
		setItem: (key, value) => data.set(key, String(value)),
		removeItem: (key) => data.delete(key),
	};
	return data;
}

test('the storage key agrees with the harness config', () => {
	// Config once said `v2` while all three components hardcoded `v1`. Nothing
	// read the key, so "fixing" the config would have silently orphaned progress.
	const config = JSON.parse(readFileSync(join(repositoryRoot, '.agents/config.json'), 'utf8'));
	assert.equal(
		STORAGE_KEY,
		config.progressStorageKey,
		'progress-store.mjs and .agents/config.json must name the same key',
	);
	assert.equal(config.progressStorage, 'browser-local');
});

test('no component declares its own storage key', () => {
	// One key, one module. Three independent declarations agreed only by luck.
	const components = [
		'KnowledgeCheck.astro',
		'LearningDashboard.astro',
		'RevisionStatus.astro',
	];
	for (const name of components) {
		const text = readFileSync(join(repositoryRoot, 'src/components/learning', name), 'utf8');
		assert.doesNotMatch(text, /localStorage/, `${name} touches localStorage directly`);
	}
});

test('the schedule is fixed intervals, not adaptive spaced repetition', () => {
	assert.deepEqual(INTERVALS, { forgot: 1, difficult: 3, remembered: 7, easy: 21 });
});

test('a rating is persisted and scheduled', () => {
	installStore();
	const result = rateRecall('topic-a', 'q1', 'remembered');
	assert.equal(result.ok, true);
	assert.equal(result.days, 7);
	assert.equal(result.attempts, 1);

	const stored = readTopic('topic-a').questions.q1;
	assert.equal(stored.rating, 'remembered');
	assert.equal(stored.attempts, 1);
	assert.ok(Date.parse(stored.nextReview) > Date.now());
});

test('repeated attempts accumulate rather than reset', () => {
	installStore();
	rateRecall('topic-a', 'q1', 'forgot');
	rateRecall('topic-a', 'q1', 'difficult');
	const stored = readTopic('topic-a').questions.q1;
	assert.equal(stored.attempts, 2);
	assert.equal(stored.rating, 'difficult');
});

test('an unknown rating is refused rather than scheduled', () => {
	installStore();
	const result = rateRecall('topic-a', 'q1', 'mastered-it');
	assert.equal(result.ok, false);
	assert.equal(result.days, null);
	assert.deepEqual(readTopic('topic-a').questions, undefined);
});

test('due topics are computed from stored review dates', () => {
	installStore();
	const past = new Date(Date.now() - 86_400_000).toISOString();
	const future = new Date(Date.now() + 86_400_000).toISOString();
	installStore({
		[STORAGE_KEY]: JSON.stringify({
			topics: {
				overdue: { questions: { q1: { nextReview: past } } },
				scheduled: { questions: { q1: { nextReview: future } } },
				untouched: {},
			},
		}),
	});
	assert.deepEqual([...dueTopicIds()].sort(), ['overdue']);
});

test('a corrupt store fails soft instead of breaking the page', () => {
	installStore({ [STORAGE_KEY]: 'not json at all' });
	assert.deepEqual(readProgress(), { topics: {} });
	assert.deepEqual(readTopic('anything'), {});
});

test('a store with the wrong shape fails soft', () => {
	installStore({ [STORAGE_KEY]: JSON.stringify({ topics: 'not an object' }) });
	assert.deepEqual(readProgress(), { topics: {} });
});

test('a write that cannot be persisted reports failure', () => {
	// A full or read-only store must be reported, not silently presented as saved.
	globalThis.localStorage = {
		getItem: () => null,
		setItem: () => {
			throw new Error('QuotaExceededError');
		},
		removeItem: () => {},
	};
	assert.equal(storageAvailable(), false);
	assert.equal(writeTopic('topic-a', { status: 'studying' }), false);
	assert.equal(rateRecall('topic-a', 'q1', 'easy').ok, false);
});

test('storage availability is probed rather than assumed', () => {
	installStore();
	assert.equal(storageAvailable(), true);
});

test('topic records merge rather than replace', () => {
	installStore();
	writeTopic('topic-a', { status: 'studying', title: 'A' });
	writeTopic('topic-a', { lastOpened: 'now' });
	assert.deepEqual(readTopic('topic-a'), { status: 'studying', title: 'A', lastOpened: 'now' });
});