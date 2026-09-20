/**
 * Small browser-safe glob matcher for the route patterns used by the installed
 * Starlight graph and view-mode plugins. It intentionally supports path globs,
 * not the full micromatch API.
 */
export function isMatch(value, patterns) {
	const list = Array.isArray(patterns) ? patterns : [patterns];
	return list.some((pattern) => typeof pattern === 'string' && matches(value, pattern));
}

function matches(value, pattern) {
	const source = pattern.startsWith('!') ? pattern.slice(1) : pattern;
	return globToRegExp(source).test(value);
}

function globToRegExp(pattern) {
	let expression = '^';
	for (let index = 0; index < pattern.length; index += 1) {
		const character = pattern[index];
		if (character === '*') {
			if (pattern[index + 1] === '*') {
				index += 1;
				if (pattern[index + 1] === '/') {
					index += 1;
					expression += '(?:.*/)?';
				} else {
					expression += '.*';
				}
			} else {
				expression += '[^/]*';
			}
		} else if (character === '?') {
			expression += '[^/]';
		} else {
			expression += character.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
		}
	}
	return new RegExp(`${expression}$`);
}

function globMatcher(patterns) {
	return (value) => isMatch(value, patterns);
}

globMatcher.isMatch = isMatch;

export default globMatcher;
