/**
 * The single heading-anchor implementation for this repository.
 *
 * Anchors used to be approximated by a hand-rolled regex in
 * `.agents/bin/deep-learn-visual.mjs`, which disagreed with the real build. The
 * verified failure, taken from this repository's own build output:
 *
 *   heading    Module 1 — Why the current harness fights the learner
 *   built id   module-1--why-the-current-harness-fights-the-learner
 *   old guess  module-1-why-the-current-harness-fights-the-learner
 *
 * A coverage row authored from either side would have validated against an
 * anchor that the published page does not have. This module delegates to
 * `github-slugger@2`, the same implementation Astro and `@astrojs/markdown-satteri`
 * use to generate heading ids, so the validator and the build cannot drift.
 *
 * `github-slugger` instances are stateful: a repeated heading is suffixed
 * (`overview`, `overview-1`, `overview-2`). Every heading of a document must
 * therefore be slugged through ONE instance, in document order. `headings()`
 * in ./markdown.mjs owns that loop.
 */

import GithubSlugger from 'github-slugger';

/** A fresh, stateful slugger. One per document. */
export function createSlugger() {
	return new GithubSlugger();
}

/**
 * Reduce a raw Markdown heading to the text content the renderer will expose.
 *
 * The build slugs the *rendered text content* of a heading, so inline Markdown
 * syntax has to be removed first: links, images, code spans, raw HTML, and
 * emphasis markers are markup, not text.
 *
 * Underscores are only stripped when they wrap a whole word, so identifiers
 * such as `snake_case` survive intact.
 */
export function headingText(rawHeading) {
	return String(rawHeading)
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links
		.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1') // reference links
		.replace(/`([^`]*)`/g, '$1') // code spans
		.replace(/<[^>]+>/g, '') // raw HTML / JSX
		.replace(/(^|[\s(])[*_]{1,3}(?=\S)(.+?)(?<=\S)[*_]{1,3}(?=[\s).,;:!?]|$)/g, '$1$2') // emphasis
		.replace(/~~/g, '') // strikethrough
		.replace(/\s+/g, ' ')
		.trim();
}

/** Slug heading text the same way the build does. Call on ONE slugger per document. */
export function slugHeading(slugger, text) {
	return `#${slugger.slug(text)}`;
}

/**
 * Read the heading ids a built HTML page actually exposes.
 *
 * Used by `doctor` to compare declared anchors against real build output
 * instead of trusting a second slugging implementation.
 */
export function builtHeadingIds(html) {
	return new Set([...String(html).matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
}

/** Read the hrefs a built HTML page actually links to. */
export function builtHrefs(html) {
	return new Set(
		[...String(html).matchAll(/\shref="([^"]+)"/g)].map((match) => match[1]),
	);
}
