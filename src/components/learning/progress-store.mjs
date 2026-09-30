/**
 * One browser-local progress store.
 *
 * Three components used to declare `deep-learn-visual:v1` independently, while
 * `.agents/config.json` said `v2`. Config was unread, the components agreed only
 * by coincidence, and changing the config to match intent would have silently
 * orphaned every learner's saved progress.
 *
 * Both sides now read this module. A test asserts it agrees with config, so the
 * key cannot drift again.
 *
 * Design constraints:
 * - browser-local only. No cross-device synchronization exists, and none is claimed.
 * - fails soft. A full, malformed, or unavailable store must never break a page.
 * - keyed by topic, not page. Progress belongs to the topic a learner is studying.
 */

/** Storage key. Must equal `progressStorageKey` in `.agents/config.json`. */
export const STORAGE_KEY = 'deep-learn-visual:v1';

const EMPTY = { topics: {} };

/** Read the whole store. Returns an empty store on any failure. */
export function readProgress() {
	try {
		const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
		if (!raw) return { ...EMPTY, topics: {} };
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== 'object' || typeof parsed.topics !== 'object' || parsed.topics === null) {
			return { ...EMPTY, topics: {} };
		}
		return parsed;
	} catch {
		// Private browsing, a corrupted entry, or a disabled store: the page must
		// still render its content.
		return { ...EMPTY, topics: {} };
	}
}

/** One topic's record, or an empty one. */
export function readTopic(topicId) {
	return readProgress().topics?.[topicId] ?? {};
}

/**
 * Merge a patch into one topic and persist.
 *
 * Returns `false` when the store could not be written, so a caller can say
 * "progress will not be saved" rather than implying it was.
 */
export function writeTopic(topicId, patch) {
	try {
		const state = readProgress();
		state.topics[topicId] = { ...(state.topics[topicId] ?? {}), ...patch };
		globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
		return true;
	} catch {
		return false;
	}
}

/**
 * Record a recall rating and return the next review date.
 *
 * The schedule is fixed intervals, an honest MVP. It is not an adaptive spaced
 * repetition algorithm and must never be described as one.
 */
export const INTERVALS = {
	forgot: 1,
	difficult: 3,
	remembered: 7,
	easy: 21,
};

/**
 * Record a recall rating and return the next review date.
 *
 * The schedule is fixed intervals, an honest MVP. It is not an adaptive spaced
 * repetition algorithm and must never be described as one.
 */
export function rateRecall(topicId, questionId, rating) {
	const days = INTERVALS[rating];
	if (!days) return { ok: false, nextReview: null, days: null, attempts: 0 };
	const now = Date.now();
	const previous = readTopic(topicId).questions?.[questionId];
	const attempts = (previous?.attempts ?? 0) + 1;
	const nextReview = new Date(now + days * 86_400_000).toISOString();
	const ok = writeTopic(topicId, {
		status: 'studying',
		lastOpened: new Date(now).toISOString(),
		questions: {
			...(readTopic(topicId).questions ?? {}),
			[questionId]: { rating, attempts, lastReviewed: new Date(now).toISOString(), nextReview },
		},
	});
	return { ok, nextReview, days, attempts };
}

/** Topic ids with something due now. */
export function dueTopicIds(now = Date.now()) {
	const due = new Set();
	for (const [id, topic] of Object.entries(readProgress().topics)) {
		if (topic.nextReview && Date.parse(topic.nextReview) <= now) due.add(id);
		for (const question of Object.values(topic.questions ?? {})) {
			if (question.nextReview && Date.parse(question.nextReview) <= now) due.add(id);
		}
	}
	return due;
}

/** Whether progress storage is usable at all. */
export function storageAvailable() {
	try {
		const probe = `${STORAGE_KEY}:probe`;
		globalThis.localStorage?.setItem(probe, '1');
		globalThis.localStorage?.removeItem(probe);
		return true;
	} catch {
		return false;
	}
}

/** Tell the rest of the page that progress changed. */
export function announceProgress() {
	document.dispatchEvent(new CustomEvent('deep-learn-progress'));
}