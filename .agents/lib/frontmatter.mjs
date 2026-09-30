/**
 * The single frontmatter parser for this repository.
 *
 * This module replaces the four independent implementations that previously
 * disagreed with each other:
 *
 *   - .agents/bin/deep-learn.mjs          line-based, scalars only (dropped arrays/nesting)
 *   - .agents/bin/deep-learn-visual.mjs   raw-block string match
 *   - .agents/bin/deep-learn-visual.mjs   single-key regex lookup
 *   - .agents/bin/deep-learn-visual.mjs   two-space-indent regex block lookup
 *
 * It parses with `js-yaml`, the same parser `@astrojs/starlight` depends on, so
 * the harness and the production build agree on what frontmatter means.
 */

import { load } from 'js-yaml';

const FRONTMATTER_BLOCK = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

export class FrontmatterError extends Error {
	constructor(message, { file, cause } = {}) {
		super(file ? `${file}: ${message}` : message);
		this.name = 'FrontmatterError';
		this.file = file;
		this.cause = cause;
	}
}

/** True when the document opens with a YAML frontmatter block. */
export function hasFrontmatter(content) {
	return FRONTMATTER_BLOCK.test(content);
}

/**
 * Parse the leading YAML frontmatter block.
 *
 * Returns `{}` for documents without frontmatter. Throws `FrontmatterError`
 * when the block exists but is not a valid YAML mapping, so a malformed file
 * fails loudly instead of being silently read as an empty object.
 */
export function readFrontmatter(content, { file } = {}) {
	const match = typeof content === 'string' ? content.match(FRONTMATTER_BLOCK) : null;
	if (!match) return {};

	let data;
	try {
		data = load(match[1], { filename: file });
	} catch (error) {
		const reason = error && error.reason ? error.reason : error.message;
		throw new FrontmatterError(`invalid YAML frontmatter: ${reason}`, { file, cause: error });
	}

	if (data === undefined || data === null) return {};
	if (typeof data !== 'object' || Array.isArray(data)) {
		throw new FrontmatterError('frontmatter must be a YAML mapping', { file });
	}
	return data;
}

/** The document body with the frontmatter block removed. */
export function readBody(content) {
	return typeof content === 'string' ? content.replace(FRONTMATTER_BLOCK, '') : '';
}

/** Read a string field, tolerating absent values. */
export function readString(data, key) {
	const value = data?.[key];
	return typeof value === 'string' ? value.trim() : undefined;
}

/**
 * Read a list of non-empty string IDs.
 *
 * Accepts a real YAML sequence and also a single scalar, so
 * `objectiveIds: mcp.explain` behaves like `objectiveIds: [mcp.explain]`.
 */
export function readIdList(data, key) {
	const value = data?.[key];
	if (value === undefined || value === null || value === '') return [];
	const items = Array.isArray(value) ? value : [value];
	return items.map((item) => (typeof item === 'string' ? item.trim() : String(item))).filter(Boolean);
}
