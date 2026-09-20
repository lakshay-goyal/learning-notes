import { defineHastPlugin } from 'satteri';

/** Publish Markdown links as extensionless Astro routes without changing the source files. */
export default defineHastPlugin({
	name: 'rewrite-local-markdown-links',
	element: {
		filter: ['a'],
		visit(node, context) {
			const href = node.properties?.href;
			if (typeof href !== 'string') return;
			context.setProperty(node, 'href', publishedHref(href));
		},
	},
});

export function publishedHref(value) {
	if (/^(?:[a-z]+:|\/|#)/i.test(value)) return value;
	const match = value.match(/^(.*?)(?:README)?\.md([?#].*)?$/i);
	if (!match) return value;
	const base = match[1];
	return `${base || './'}${base && !base.endsWith('/') ? '/' : ''}${match[2] ?? ''}`;
}
