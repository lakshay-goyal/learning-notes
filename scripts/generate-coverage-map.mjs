#!/usr/bin/env node
/**
 * One-off generator for `.agents/coverage/learning-harness-redesign.md`.
 *
 * The pilot topic has 218 level-two research headings. Writing the coverage map
 * by hand guarantees transcription errors in anchor slugs; generating it from the
 * same heading parser the validator uses guarantees the anchors match.
 *
 * Run from the repository root:
 *   node scripts/generate-coverage-map.mjs
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { relative } from 'node:path';
import { headings } from '../.agents/lib/markdown.mjs';
import { researchSourceFiles } from '../.agents/lib/harness.mjs';

const DIR = 'docs/learning-harness-redesign';
const L = 'src/content/docs/learning-harness-redesign';

/**
 * A coverage destination: one file plus one anchor inside it.
 *
 * The validator checks the anchor against the headings of the named file, so a
 * cross-page reference must name that page's file rather than writing a relative
 * path into the anchor column.
 */
function at(page, anchor) {
	return { destination: `${L}/${page}/index.mdx`, anchor };
}

/** Research file -> [destination file, fallback anchor, per-section overrides]. */
const MAP = {
	'README.md': [L + '/index.mdx', '#the-problem', {
		'The 60-second version': '#the-problem',
		'What is implemented in this worktree': '#the-rebuilt-contracts',
		'Choose your path': '#where-to-go-next',
		'The three recommended learning paths': '#where-to-go-next',
		'The target in one picture': '#three-root-causes',
		'What is worth keeping': '#the-rebuilt-contracts',
		'What must change': '#the-rebuilt-contracts',
		'Interactive checkpoint': '#test-yourself',
		'The first implementation decision': at('gates', '#migration-mechanics'),
		'Package navigation': '#complete-research-access',
		'Validation record': '#complete-research-access',
		'Update history': '#complete-research-access',
	}],
	'modules/01-current-diagnosis.md': [L + '/diagnosis/index.mdx', '#the-two-root-causes', {
		'Learning objective': '#the-two-root-causes',
		'The 60-second mental model': '#the-n--1-pattern',
		'The two root causes': '#the-two-root-causes',
		'The evidence': '#the-evidence',
		'Why this happened': '#the-n--1-pattern',
		'What is actually a good decision here': '#what-was-worth-keeping',
		'Interactive diagnosis': '#five-questions-before-changing-a-prompt',
		Checkpoint: '#test-yourself',
		Takeaways: '#test-yourself',
		Next: '#where-next',
	}],
	'modules/02-content-ontology.md': [L + '/ontology/index.mdx', '#the-canonical-entities', {
		'Learning objective': '#the-canonical-entities',
		'The problem with one folder tree': '#the-problem-with-one-folder-tree',
		'The canonical entities': '#the-canonical-entities',
		'Which relationships are hierarchical?': '#which-relationships-are-hierarchical',
		'Why stable IDs matter': '#why-stable-ids-matter',
		'A worked example: MCP': '#which-relationships-are-hierarchical',
		'Path design': '#path-design',
		'Interactive classification': '#test-yourself',
		Checkpoint: '#test-yourself',
		Takeaways: '#test-yourself',
		Next: '#where-next',
	}],
	'modules/03-topic-module-page-model.md': [L + '/page-model/index.mdx', '#the-central-rule', {
		'Learning objective': '#the-central-rule',
		'The central rule': '#the-central-rule',
		'Why module comes before page': '#why-module-comes-before-page',
		'A page-planning algorithm': '#the-planning-algorithm',
		'Split signals': '#split-signals',
		'Merge signals': '#merge-signals',
		'Worked MCP decomposition': '#what-this-topic-did',
		'Coverage without a giant page': '#the-central-rule',
		'Interactive page-plan exercise': '#test-yourself',
		Checkpoint: '#test-yourself',
		Takeaways: '#test-yourself',
		Next: '#where-next',
	}],
	'modules/04-learning-lifecycle.md': [L + '/lifecycle/index.mdx', '#the-lifecycle', {
		'Learning objective': '#the-lifecycle',
		'The missing distinction': '#the-missing-distinction',
		'The learning lifecycle': '#the-lifecycle',
		'Progressive disclosure': '#progressive-disclosure',
		'Interleaving practice': '#interleaving-practice',
		'Learning evidence ladder': '#the-learning-evidence-ladder',
		'Anti-overload rules': '#anti-overload-rules',
		'Interactive lifecycle diagnosis': '#test-yourself',
		Checkpoint: '#test-yourself',
		Takeaways: '#test-yourself',
		Next: '#where-next',
	}],
	'modules/05-harness-architecture.md': [L + '/gates/index.mdx', '#one-source-of-truth', {
		'Learning objective': '#one-source-of-truth',
		'The architecture principle': '#one-source-of-truth',
		'One source of truth': '#one-source-of-truth',
		'Shared parser strategy': '#shared-parsers-and-one-route-resolver',
		'Topic manifest': '#state-machines',
		'State machines': '#state-machines',
		'Safe transitions': '#safe-transitions',
		'Quality gates by concern': '#the-gates',
		'Recoverable commands': '#recoverable-commands',
		'Multi-agent safety': '#multi-agent-safety',
		'Interactive gate design': '#match-the-failure-to-the-gate',
		Checkpoint: '#test-yourself',
		Takeaways: '#test-yourself',
		Next: '#where-next',
	}],
	'modules/06-astro-learning-experience.md': [L + '/gates/index.mdx', '#the-gates', {
		'Learning objective': '#the-gates',
		'The app is not the main limitation': '#the-gates',
		'Route design': '#shared-parsers-and-one-route-resolver',
		'Navigation requirements': '#shared-parsers-and-one-route-resolver',
		'Progressive disclosure': '#migration-mechanics',
		'Accessibility contract': '#match-the-failure-to-the-gate',
		'Diagram selection': '#the-gates',
		'Progress model': '#state-machines',
		'Dashboard design': '#state-machines',
		'Research route integration': '#one-source-of-truth',
		'Interactive design review': '#test-yourself',
		Takeaways: '#test-yourself',
		Next: '#where-next',
	}],
	'modules/07-multi-agent-orchestration.md': [L + '/gates/index.mdx', '#multi-agent-safety', {
		'Learning objective': '#multi-agent-safety',
		'The current opportunity': '#multi-agent-safety',
		'Roles and ownership': '#multi-agent-safety',
		'The orchestration sequence': '#multi-agent-safety',
		'Why the manager must own IDs': '#one-source-of-truth',
		'Parallelism rules': '#multi-agent-safety',
		'Handoff contract': '#multi-agent-safety',
		'Conflict prevention': '#multi-agent-safety',
		'Failure recovery': '#recoverable-commands',
		'Prompt protocol for each worker': '#multi-agent-safety',
		'Interactive orchestration scenario': '#test-yourself',
		Checkpoint: '#test-yourself',
		Takeaways: '#test-yourself',
		Next: '#where-next',
	}],
	'modules/08-migration-roadmap.md': [L + '/gates/index.mdx', '#migration-mechanics', {
		'Learning objective': '#migration-mechanics',
		'Phase 0 — Reconcile the current state': '#migration-mechanics',
		'Phase 1 — Make the new contract legal': '#migration-mechanics',
		'Phase 2 — Add manifests and shared schemas': '#migration-mechanics',
		'Phase 3 — Redesign research generation': '#migration-mechanics',
		'Phase 4 — Generalize the published experience': '#migration-mechanics',
		'Phase 5 — Pilot two topics': '#migration-mechanics',
		'Phase 6 — Add learner evidence and maintenance': '#migration-mechanics',
		'Phase 7 — Scale the content system': '#migration-mechanics',
		'Keep, change, kill playbook': '#migration-mechanics',
		'Risk register': '#the-gates',
		'Decision gates': '#the-gates',
		'Interactive roadmap exercise': '#test-yourself',
		Checkpoint: '#test-yourself',
		Takeaways: '#test-yourself',
		Next: '#where-next',
		'Completion checklist': '#test-yourself',
		'Final reflection': '#test-yourself',
	}],
	'exercises.md': [L + '/practice/index.mdx', '#lab-1--scaffold-and-inspect', {
		'How to use this workshop': '#lab-1--scaffold-and-inspect',
		'Concept and debugging checks': '#check-your-work',
		'Interactive diagnosis: find the accidental architecture': '#lab-2--find-the-accidental-architecture',
		'Redesign workshop': '#lab-1--scaffold-and-inspect',
		'Architecture decision records': '#lab-4--design-the-failure-table',
		'Prompt-routing simulation': '#lab-2--find-the-accidental-architecture',
		'Validation design challenge': '#lab-4--design-the-failure-table',
		'Migration drill: split MCP without breaking it': '#lab-3--migrate-without-losing-content',
		'Codebase-reading exercise': '#lab-2--find-the-accidental-architecture',
		'Transfer challenge: design a harness for a different domain': '#lab-4--design-the-failure-table',
		'Self-assessment': '#check-your-work',
	}],
	'revision.md': [L + '/review/index.mdx', '#level-1--mental-model', {
		'Level 1 — Mental model': '#level-1--mental-model',
		'Level 2 — Content ontology': '#level-2--content-ontology',
		'Level 3 — Mechanisms': '#level-3--mechanisms',
		'Level 4 — Architecture decisions': '#level-4--architecture-decisions',
		'Level 5 — Harness and agent design': '#level-5--harness-and-agent-design',
		'Level 6 — Failure and recovery': '#level-6--failure-and-recovery',
		'Level 7 — Transfer challenge': '#level-7--transfer',
		'Review record': '#level-7--transfer',
	}],
	'implementation.md': [L + '/gates/index.mdx', '#migration-mechanics', {
		Outcome: '#one-source-of-truth',
		'Architecture at a glance': '#one-source-of-truth',
		'1. Separate the major intents': '#state-machines',
		'2. Introduce a canonical topic manifest': '#state-machines',
		'3. Define topic and page schemas separately': '#one-source-of-truth',
		'4. Build the taxonomy registry': at('ontology', '#why-stable-ids-matter'),
		'5. Replace the fixed research package': at('lifecycle', '#the-lifecycle'),
		'6. Add a knowledge-modeling stage': at('lifecycle', '#the-lifecycle'),
		'7. Change the visual cardinality rule': '#migration-mechanics',
		'8. Separate research integrity from learning coverage': '#the-gates',
		'9. Centralize schemas and parsers': '#shared-parsers-and-one-route-resolver',
		'10. Make scaffolding recoverable': '#recoverable-commands',
		'11. Derive navigation and backlinks': '#shared-parsers-and-one-route-resolver',
		'12. Model learner evidence': '#state-machines',
		'13. Add auditable semantic review': '#the-gates',
		'14. Add an aggregate release gate': '#recoverable-commands',
		'15. Use multiple agents only after contracts exist': '#multi-agent-safety',
		'16. Pilot strategy': '#migration-mechanics',
		'Acceptance criteria': '#match-the-failure-to-the-gate',
		'Recommended implementation order': '#migration-mechanics',
	}],
	'repositories.md': [L + '/diagnosis/index.mdx', '#the-evidence', {
		'Selection method': '#five-questions-before-changing-a-prompt',
		Repository: '#the-evidence',
		Architecture: at('gates', '#one-source-of-truth'),
		'Inspected paths and what they reveal': '#the-evidence',
		'End-to-end trace: publishing a second topic': at('lifecycle', '#the-lifecycle'),
		'Observed failure conditions': at('gates', '#match-the-failure-to-the-gate'),
		'Recommended reading itinerary': '#five-questions-before-changing-a-prompt',
		'Practical modifications to try': at('practice', '#lab-3--migrate-without-losing-content'),
		Limitations: '#the-evidence',
	}],
	'research-plan.md': [L + '/lifecycle/index.mdx', '#the-lifecycle', {
		Scope: '#the-lifecycle',
		'Practical outcomes': at('page-model', '#1-write-observable-objectives'),
		'Existing knowledge and prerequisites': at('ontology', '#the-canonical-entities'),
		'Core questions': '#the-missing-distinction',
		'Architecture questions': '#the-lifecycle',
		'Evidence plan': at('gates', '#one-source-of-truth'),
		'Version and compatibility targets': '#the-learning-evidence-ladder',
		'Capability assessment': '#the-missing-distinction',
		'Planned package': '#the-lifecycle',
		'Stop conditions': '#the-lifecycle',
		'Coverage and validation review': at('gates', '#the-gates'),
	}],
	'sources.md': [L + '/index.mdx', '#complete-research-access', {
		'Source 1 — Astro Content Collections': '#complete-research-access',
		'Source 2 — Astro Routing': '#complete-research-access',
		'Source 3 — Starlight: Authoring Content in Markdown': '#complete-research-access',
		'Source 4 — Repository source snapshot': '#complete-research-access',
		Limitations: '#complete-research-access',
	}],
};

/** Files excluded from the teaching surface, with the reason recorded per row. */
const EXCLUDED = {
	'AGENT_MASTER_PROMPT.md':
		'Outside the learning objective: a tool-agnostic agent operating prompt, not teaching material. Preserved verbatim at its research route, and its enforced rules now live in AGENTS.md.',
};

const MAPPED_NOTE =
	'Taught on the mapped destination page; the complete research section stays readable at its research route.';

function escapeCell(value) {
	return String(value).replaceAll('|', '\\|');
}

const rows = [];
for (const file of researchSourceFiles(DIR, 'learning.md')) {
	const rel = relative(DIR, file);
	for (const heading of headings(readFileSync(file, 'utf8'), { min: 2, max: 2 })) {
		const exclusion = EXCLUDED[rel];
		if (exclusion) {
			rows.push([rel, heading.text, '', '', 'INTENTIONALLY_EXCLUDED', exclusion]);
			continue;
		}
		const entry = MAP[rel];
		if (!entry) throw new Error(`no coverage mapping declared for research file: ${rel}`);
		const [destination, fallback, overrides] = entry;
		const target = (overrides && overrides[heading.text]) || fallback;
		// A string means "the anchor is on this research file's own page".
		// An object means the finding is taught on another page of the topic.
		const crossPage = typeof target === 'object' && target !== null;
		rows.push([
			rel,
			heading.text,
			crossPage ? target.destination : destination,
			crossPage ? target.anchor : target,
			'MAPPED',
			MAPPED_NOTE,
		]);
	}
}

const mapped = rows.filter((row) => row[4] === 'MAPPED').length;
const excluded = rows.length - mapped;

const table = [
	'| Source file | Source section | Destination file | Destination anchor | Status | Transformation |',
	'| --- | --- | --- | --- | --- | --- |',
	...rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`),
].join('\n');

const output = `# Research coverage: Learning Harness Redesign

- Research source: \`docs/learning-harness-redesign/\`
- Learning design: \`docs/learning-harness-redesign/learning.md\`
- Overview route: \`/learning-harness-redesign/\`
- Presentation: \`src/content/docs/learning-harness-redesign/\` — one overview plus seven focused pages
- Reviewed: 2026-10-01

Every level-two source heading is accounted for. \`MAPPED\` means the finding is taught
directly or remains recoverable through the linked research route. \`learning.md\` and
\`review/\` are agent output, not research source, so they are not coverage sources.

| Sections | Mapped | Intentionally excluded |
| --- | ---: | ---: |
| ${rows.length} | ${mapped} | ${excluded} |

${table}
`;

mkdirSync('.agents/coverage', { recursive: true });
writeFileSync('.agents/coverage/learning-harness-redesign.md', output);
console.log(`Wrote .agents/coverage/learning-harness-redesign.md — ${rows.length} rows (${mapped} mapped, ${excluded} excluded).`);