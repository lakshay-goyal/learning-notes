import { fileURLToPath } from 'node:url';

const shimPath = fileURLToPath(new URL('../shims/browser-glob.mjs', import.meta.url));

/** Keep Node-oriented glob packages out of the two browser entrypoints that use them. */
export default function browserGlobShim() {
	return {
		name: 'deep-learn-browser-glob-shim',
		enforce: 'pre',
		resolveId(source, importer) {
			if (source === 'micromatch' && importer?.includes('starlight-site-graph/components/graph/')) {
				return shimPath;
			}
			if (source === 'picomatch' && importer?.includes('starlight-view-modes/libs/utils')) {
				return shimPath;
			}
		},
	};
}
