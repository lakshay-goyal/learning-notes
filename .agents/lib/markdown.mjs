/**
 * Fence-aware Markdown scanning shared by both harness CLIs.
 *
 * Every structural scan in this repository goes through here so that a `#`
 * comment inside a fenced code block is never mistaken for a heading, and a
 * Markdown link inside a fence is never mistaken for a real one.
 *
 * Prior art that this module consolidates:
 *   - .agents/bin/deep-learn.mjs        checkFences / markdownLinksOutsideFences / localLinkTarget
 *   - .agents/bin/deep-learn-visual.mjs headings (was NOT fence-aware)
 */

import { createSlugger, headingText, slugHeading } from './anchors.mjs';

const FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/;

/**
 * Walk the document line by line, reporting whether each line is inside a
 * fenced code block. Fence state is shared across the whole walk.
 */
export function* scanLines(content) {
	let open;
	for (const [index, text] of String(content).split(/\r?\n/).entries()) {
		const fence = text.match(FENCE);
		if (fence) {
			const marker = fence[1][0];
			const length = fence[1].length;
			if (!open) {
				open = { marker, length, line: index + 1 };
				yield { text, inFence: true, fenceOpened: true };
				continue;
			}
			if (open.marker === marker && length >= open.length && fence[2].trim() === '') {
				open = undefined;
				yield { text, inFence: true, fenceOpened: false, fenceClosed: true };
				continue;
			}
			yield { text, inFence: true };
			continue;
		}
		yield { text, inFence: Boolean(open) };
	}
}

/** The first unclosed code fence, or `undefined`. */
export function unclosedFence(content) {
	let open;
	for (const [index, text] of String(content).split(/\r?\n/).entries()) {
		const fence = text.match(FENCE);
		if (!fence) continue;
		const marker = fence[1][0];
		const length = fence[1].length;
		if (!open) open = { marker, length, line: index + 1 };
		else if (open.marker === marker && length >= open.length && fence[2].trim() === '') open = undefined;
	}
	return open;
}

/**
 * Headings with build-accurate anchors.
 *
 * All headings of one document MUST be produced by a single call so they share
 * one slugger and repeated headings get distinct suffixed anchors.
 */
export function headings(content, { min = 2, max = 6 } = {}) {
	const slugger = createSlugger();
	const result = [];
	for (const { text: line, inFence } of scanLines(content)) {
		if (inFence) continue;
		const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
		if (!match) continue;
		const level = match[1].length;
		if (level < min || level > max) continue;
		const text = headingText(match[2]);
		if (!text) continue;
		result.push({ level, text, anchor: slugHeading(slugger, text) });
	}
	return result;
}

/** Markdown link targets that are not inside a fenced code block. */
export function markdownLinks(content) {
	const links = [];
	for (const { text, inFence } of scanLines(content)) {
		if (inFence) continue;
		for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) links.push(match[1].trim());
	}
	return links;
}

/** Root-relative routes referenced from Markdown or MDX. */
export function rootRelativeRoutes(content) {
	const routes = new Set();
	for (const match of String(content).matchAll(/\]\((\/[^)\s]+)\)/g)) routes.add(match[1]);
	for (const match of String(content).matchAll(/\bhref=["'](\/[^"']+)["']/g)) routes.add(match[1]);
	return [...routes];
}

/** Relative `import` specifiers used by MDX pages. */
export function relativeImports(content) {
	return [...String(content).matchAll(/\bfrom\s+["'](\.[^"']+)["']/g)].map((match) => match[1]);
}

/**
 * Reduce a Markdown link target to a local filesystem-relative path.
 * Returns `undefined` for external, anchor-only, and protocol-relative links.
 */
export function localLinkTarget(raw) {
	let value = String(raw).trim();
	if (value.startsWith('<') && value.endsWith('>')) value = value.slice(1, -1);
	if (/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(value)) return undefined;
	value = value.split(/\s+["']/)[0].split('#')[0].split('?')[0];
	if (!value) return undefined;
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}
