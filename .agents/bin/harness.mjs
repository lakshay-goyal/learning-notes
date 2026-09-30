#!/usr/bin/env node

/**
 * The harness orchestrator.
 *
 * Three jobs the two learning CLIs do not do:
 *
 *   1. `features`  — read `.agents/features.json` and report VCR, the
 *      verification-completion ratio. VCR below 1.0 means something was
 *      activated and not finished, which is the single number that makes
 *      "overreach and under-finishing" visible instead of anecdotal.
 *   2. `receipt`   — write a machine-readable record of what actually ran, so a
 *      completion claim cites evidence rather than asserting it.
 *   3. `check`     — run the three gate layers in order and refuse to continue
 *      past a failing one.
 *
 * The previous aggregate gate was `package.json`'s `harness:check`, a shell of
 * npm scripts. It reported the exit code of its last command only, so an early
 * failure could be hidden by a later success, and nothing enforced ordering.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
	exceptionFor,
	harnessPath,
	loadConfig,
	readJson,
	relPath,
	writeJson,
} from '../lib/harness.mjs';

const SCRIPT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const FEATURE_STATES = new Set(['not-started', 'in-progress', 'blocked', 'done']);

/** Activated = anything that is not `not-started`. VCR denominator. */
function isActivated(feature) {
	return feature.state !== 'not-started';
}

function isPassing(feature) {
	return feature.state === 'done';
}

/**
 * VCR: passing features over activated features.
 *
 * Returns `null` when nothing is activated, which means "no signal" rather than
 * a perfect score. Reporting 1.0 for an untouched list would be the same lie as
 * reporting completion from an empty denominator.
 */
function computeVcr(features) {
	const activated = features.filter(isActivated);
	if (!activated.length) return { vcr: null, passing: 0, activated: 0, total: features.length };
	const passing = activated.filter(isPassing).length;
	return { vcr: passing / activated.length, passing, activated: activated.length, total: features.length };
}

/** Validate the feature list against the three-part contract. */
function validateFeatureList(root, config) {
	const path = harnessPath(root, config, 'featureListPath', '.agents/features.json');
	if (!existsSync(path)) {
		return { path, features: [], problems: [`feature list is missing: ${relPath(root, path)}`] };
	}
	let data;
	try {
		data = readJson(path);
	} catch (error) {
		return { path, features: [], problems: [error.message] };
	}
	const features = Array.isArray(data.features) ? data.features : [];
	const problems = [];
	const ids = new Set();

	for (const feature of features) {
		const where = `feature "${feature.id || '(no id)'}"`;
		if (!feature.id) problems.push(`${where}: missing id`);
		else if (ids.has(feature.id)) problems.push(`${where}: duplicate id`);
		else ids.add(feature.id);

		if (!feature.behavior) problems.push(`${where}: missing behavior`);
		if (!feature.verify) problems.push(`${where}: missing verify command`);
		if (!FEATURE_STATES.has(feature.state)) {
			problems.push(`${where}: state "${feature.state}" is invalid; expected ${[...FEATURE_STATES].join(', ')}`);
		}
		// The rule that stops an agent declaring victory: only verification may
		// move a feature to done.
		if (feature.state === 'done' && !feature.evidence) {
			problems.push(`${where}: state is done but no evidence is recorded; only a passing verification may set done`);
		}
		if (feature.state === 'blocked' && !feature.blocked_by) {
			problems.push(`${where}: state is blocked but no blocked_by reason is recorded`);
		}
	}
	return { path, features, problems };
}

function featuresCommand(root, config, args) {
	const json = args.includes('--json');
	if (args.some((arg) => !['--json'].includes(arg))) {
		console.error('Usage: node .agents/bin/harness.mjs features [--json]');
		process.exit(1);
	}

	const { path, features, problems } = validateFeatureList(root, config);
	const { vcr, passing, activated, total } = computeVcr(features);
	const inProgress = features.filter((feature) => feature.state === 'in-progress');
	const blocked = features.filter((feature) => feature.state === 'blocked');

	if (json) {
		console.log(
			JSON.stringify(
				{
					ok: problems.length === 0,
					featureList: relPath(root, path),
					summary: { total, activated, passing, vcr, inProgress: inProgress.length, blocked: blocked.length },
					features: features.map((feature) => ({
						id: feature.id,
						state: feature.state,
						verify: feature.verify,
						hasEvidence: Boolean(feature.evidence),
					})),
					problems,
				},
				null,
				2,
			),
		);
		if (problems.length) process.exit(1);
		return;
	}

	console.log(`Feature list: ${relPath(root, path)}`);
	console.log(`Activated: ${activated}/${total}   passing: ${passing}   VCR: ${vcr === null ? 'no signal (nothing activated)' : vcr.toFixed(2)}`);
	if (inProgress.length > 1) {
		console.log(`Warning: ${inProgress.length} features in progress (${inProgress.map((f) => f.id).join(', ')}); WIP=1 is the safe default.`);
	}
	for (const feature of features) {
		if (feature.state === 'done') continue;
		const marker = { 'not-started': ' ', 'in-progress': '>', blocked: '!', done: 'x' }[feature.state] || '?';
		const suffix = feature.blocked_by ? ` — blocked: ${feature.blocked_by}` : '';
		console.log(`  [${marker}] ${feature.id}: ${feature.state}${suffix}`);
	}
	for (const problem of problems) console.error(`Error: ${problem}`);
	if (problems.length) process.exit(1);
}

/**
 * The three gate layers.
 *
 * Ordering matters: a structural failure makes the runtime and system results
 * untrustworthy, so a later layer does not run while an earlier one fails. The
 * old aggregate npm script ran all three and reported only the last exit code.
 */
const GATE_LAYERS = [
	{
		name: 'static',
		description: 'structural truth: research and visual contracts',
		commands: [
			['node', ['.agents/bin/deep-learn.mjs', 'validate', '--all', '--strict']],
			['node', ['.agents/bin/deep-learn-visual.mjs', 'validate', '--all', '--strict']],
		],
	},
	{ name: 'runtime', description: 'executable assertions', commands: [['npm', ['test', '--silent']]] },
	{
		name: 'system',
		description: 'the repository builds and its state is coherent',
		commands: [
			['node', ['.agents/bin/deep-learn.mjs', 'doctor']],
			['npm', ['run', 'build', '--silent']],
		],
	},
];

function runLayer(root, layer) {
	const results = [];
	for (const [command, commandArgs] of layer.commands) {
		const result = spawnSync(command, commandArgs, { cwd: root, encoding: 'utf8' });
		const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
		results.push({
			command: [command, ...commandArgs].join(' '),
			status: result.status === null ? 1 : result.status,
			output: output.split('\n').slice(-12).join('\n'),
		});
		if (results.at(-1).status !== 0) break;
	}
	return { layer: layer.name, description: layer.description, ok: results.every((r) => r.status === 0), results };
}

function checkCommand(root, config, args) {
	const json = args.includes('--json');
	const only = args.find((arg) => arg.startsWith('--layer='))?.split('=')[1];
	const unknown = args.filter((arg) => arg !== '--json' && !arg.startsWith('--layer='));
	if (unknown.length) {
		console.error(`Usage: node .agents/bin/harness.mjs check [--json] [--layer=<name>]`);
		console.error(`unexpected argument(s): ${unknown.join(' ')}`);
		process.exit(1);
	}

	const layers = only ? GATE_LAYERS.filter((layer) => layer.name === only) : GATE_LAYERS;
	if (!layers.length) {
		console.error(`unknown layer "${only}"; expected ${GATE_LAYERS.map((l) => l.name).join(', ')}`);
		process.exit(1);
	}

	const reports = [];
	for (const layer of layers) {
		const report = runLayer(root, layer);
		reports.push(report);
		if (!report.ok) {
			// Do not proceed: a failing earlier layer makes later results noise.
			break;
		}
	}

	const ok = reports.length === layers.length && reports.every((report) => report.ok);
	const ranLayers = reports.map((report) => report.layer);

	if (json) {
		console.log(JSON.stringify({ ok, layersRan: ranLayers, layersSkipped: layers.map((l) => l.name).filter((n) => !ranLayers.includes(n)), reports }, null, 2));
	} else {
		for (const report of reports) {
			const status = report.ok ? 'PASS' : 'FAIL';
			console.log(`${status}  ${report.layer.padEnd(8)} ${report.description}`);
			for (const result of report.results) {
				console.log(`        ${result.status === 0 ? 'ok  ' : 'fail'} ${result.command}`);
				if (result.status !== 0 && result.output) {
					for (const line of result.output.split('\n')) console.log(`             ${line}`);
				}
			}
		}
		const skipped = layers.map((l) => l.name).filter((name) => !ranLayers.includes(name));
		if (skipped.length) console.log(`SKIPPED (an earlier layer failed): ${skipped.join(', ')}`);
		console.log(ok ? 'All gate layers passed.' : 'Gate failed. Fix the first failing layer before proceeding.');
	}

	if (!ok) process.exit(1);
}

/**
 * Write a receipt: what ran, at which commit, with which exit codes.
 *
 * A completion claim should cite one of these. It turns "validation passed" into
 * a checkable artifact instead of an assertion, which is the difference between
 * a self-reported gate and an enforced one.
 */
function receiptCommand(root, config, args) {
	const json = args.includes('--json');
	const slug = args.find((arg) => !arg.startsWith('--'));
	if (!slug) {
		console.error('Usage: node .agents/bin/harness.mjs receipt <topic-slug> [--json]');
		process.exit(1);
	}

	const commands = [
		['node', ['.agents/bin/deep-learn.mjs', 'validate', slug, '--strict']],
		['node', ['.agents/bin/deep-learn-visual.mjs', 'validate', slug, '--strict']],
	];
	const results = commands.map(([command, commandArgs]) => {
		const result = spawnSync(command, commandArgs, { cwd: root, encoding: 'utf8' });
		return {
			command: [command, ...commandArgs].join(' '),
			exitCode: result.status === null ? 1 : result.status,
			ok: result.status === 0,
		};
	});

	const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
	const receipt = {
		slug,
		recordedAt: new Date().toISOString(),
		commit: head.status === 0 ? head.stdout.trim() : 'unknown',
		checks: results,
		ok: results.every((result) => result.ok),
	};

	const evidenceDir = harnessPath(root, config, 'evidenceDirectory', '.agents/evidence');
	const path = join(evidenceDir, `${slug}.json`);
	writeJson(path, receipt);

	if (json) {
		console.log(JSON.stringify(receipt, null, 2));
	} else {
		console.log(`Receipt: ${relPath(root, path)} (${receipt.ok ? 'passing' : 'failing'} at ${receipt.commit.slice(0, 8)})`);
		for (const result of results) console.log(`  ${result.ok ? 'ok  ' : 'fail'} ${result.command}`);
	}
	if (!receipt.ok) process.exit(1);
}

/** Summarize the harness state a new session needs before doing anything else. */
function statusCommand(root, config, args) {
	const json = args.includes('--json');
	const { features, problems } = validateFeatureList(root, config);
	const { vcr, passing, activated, total } = computeVcr(features);
	const exceptions = existsSync(harnessPath(root, config, 'exceptionsFile', '.agents/state/exceptions.json'))
		? readJson(harnessPath(root, config, 'exceptionsFile', '.agents/state/exceptions.json')).exceptions || []
		: [];

	const doctor = spawnSync('node', ['.agents/bin/deep-learn.mjs', 'doctor', '--json'], {
		cwd: root,
		encoding: 'utf8',
	});
	let findings = [];
	try {
		findings = JSON.parse(doctor.stdout).findings || [];
	} catch {
		findings = [{ level: 'error', category: 'doctor', message: 'doctor did not emit JSON' }];
	}

	const progressPath = harnessPath(root, config, 'progressFile', '.agents/PROGRESS.md');
	const payload = {
		progressFile: existsSync(progressPath) ? relPath(root, progressPath) : null,
		features: { total, activated, passing, vcr, problems },
		exceptions: exceptions.map((entry) => ({ id: entry.id, reviewBy: entry.reviewBy })),
		doctorErrors: findings.filter((f) => f.level === 'error'),
		doctorWarnings: findings.filter((f) => f.level === 'warning').length,
	};

	if (json) {
		console.log(JSON.stringify(payload, null, 2));
		return;
	}
	console.log(`Progress: ${payload.progressFile || 'missing'}`);
	console.log(`Features: ${passing}/${activated} activated passing (VCR ${vcr === null ? 'n/a' : vcr.toFixed(2)} of ${total})`);
	console.log(`Exceptions: ${exceptions.length} acknowledged${exceptions.length ? ` (${exceptions.map((e) => e.id).join(', ')})` : ''}`);
	console.log(`Doctor: ${payload.doctorErrors.length} error(s), ${payload.doctorWarnings} warning(s)`);
	for (const finding of payload.doctorErrors) console.log(`  error [${finding.category}] ${finding.message}`);
}

function printHelp(config) {
	console.log(`${config.harnessName} orchestrator (${config.harnessRoot}/)

Usage:
  node .agents/bin/harness.mjs status [--json]          session start state
  node .agents/bin/harness.mjs features [--json]        feature list and VCR
  node .agents/bin/harness.mjs check [--json] [--layer=NAME]
  node .agents/bin/harness.mjs receipt <slug> [--json]

Gate layers, run in order and never skipped past a failure:
  static   research and visual contracts
  runtime  npm test
  system   doctor plus the production build

\`.agents/PROGRESS.md\` is the durable resume pointer; read it first.
The internal --root <path> option supports isolated harness tests.`);
}

const rawArgs = process.argv.slice(2);

/** Pull `--root <path>` out without disturbing the positional command. */
const rootIndex = rawArgs.indexOf('--root');
const root = resolve(rootIndex === -1 ? SCRIPT_ROOT : rawArgs[rootIndex + 1]);
// `rootIndex + 1` is 0 when there is no `--root`, which would silently drop the
// command itself and print help for every invocation.
const args = rawArgs.filter(
	(arg, index) => arg !== '--root' && !(rootIndex !== -1 && index === rootIndex + 1),
);

let config;
try {
	config = loadConfig(root);
} catch (error) {
	console.error(`Error: ${error.message}`);
	process.exit(1);
}
const command = args.shift();
const rest = args;

switch (command) {
	case 'status':
		statusCommand(root, config, rest);
		break;
	case 'features':
		featuresCommand(root, config, rest);
		break;
	case 'check':
		checkCommand(root, config, rest);
		break;
	case 'receipt':
		receiptCommand(root, config, rest);
		break;
	case 'help':
	case '--help':
	case '-h':
	case undefined:
		printHelp(config);
		break;
	default:
		console.error(`unknown command "${command}"; run with --help`);
		process.exit(1);
}