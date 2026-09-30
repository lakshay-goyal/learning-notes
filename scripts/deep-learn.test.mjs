import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(repositoryRoot, 'scripts/deep-learn.mjs');

function run(root, ...args) {
  return spawnSync(process.execPath, [cli, ...args, '--root', root], {
    encoding: 'utf8',
  });
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'deep-learn-test-'));
  mkdirSync(join(root, '.agents'), { recursive: true });
  cpSync(join(repositoryRoot, '.agents/config.json'), join(root, '.agents/config.json'));
  cpSync(join(repositoryRoot, '.agents/templates/research'), join(root, '.agents/templates/research'), { recursive: true });
  mkdirSync(join(root, 'docs'));
  writeFileSync(
    join(root, 'docs/README.md'),
    '# Test knowledge base\n\n<!-- DEEP_LEARN_INDEX_START -->\n<!-- DEEP_LEARN_INDEX_END -->\n',
  );
  return root;
}

/**
 * Mark a scaffolded topic validated without editing every file by hand.
 *
 * Strict validation requires a verified `versions` boundary and a real source
 * entry, so a fixture that only wants to exercise one later check would
 * otherwise fail earlier for unrelated reasons.
 */
function markValidated(root, slug) {
  const dir = join(root, 'docs', slug);
  const readme = join(dir, 'README.md');
  writeFileSync(
    readme,
    readFileSync(readme, 'utf8')
      .replace(/^status: "draft"$/m, 'status: "validated"')
      .replace(/^versions: "UNVERIFIED"$/m, 'versions: "1.0.0"'),
  );
  writeFileSync(
    join(dir, 'sources.md'),
    '# Sources\n\n## Source 1 — [Reference](https://example.com/reference)\n\n' +
      '- Source type: `OFFICIAL_DOCUMENTATION`\n' +
      '- Inspection status: `ANALYZED`\n',
  );
  // Strict validation also rejects unresolved questions and TODO markers, so a
  // fixture has to clear them before the version check is what fails.
  const plan = join(dir, 'research-plan.md');
  if (existsSync(plan)) {
    writeFileSync(
      plan,
      readFileSync(plan, 'utf8')
        .replace(/^\|\s*OPEN\s*\|/gm, '| ANSWERED |')
        .replace(/<!--\s*TODO[\s\S]*?-->/g, 'Answered.'),
    );
  }
  for (const file of ['README.md', 'revision.md']) {
    const path = join(dir, file);
    if (existsSync(path)) {
      writeFileSync(path, readFileSync(path, 'utf8').replace(/<!--\s*TODO[\s\S]*?-->/g, 'Answered.'));
    }
  }
}

test('scaffolds, indexes, validates, and refuses duplicate topics', (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const created = run(root, 'new', 'Distributed Queues', '--mode', 'deep', '--with-repository-analysis');
  assert.equal(created.status, 0, created.stderr);
  const topic = join(root, 'docs/distributed-queues');
  for (const file of [
    'README.md',
    'research-plan.md',
    'implementation.md',
    'exercises.md',
    'revision.md',
    'sources.md',
    'repositories.md',
  ]) {
    assert.equal(existsSync(join(topic, file)), true, `${file} was not created`);
  }
  assert.match(readFileSync(join(root, 'docs/README.md'), 'utf8'), /\[Distributed Queues\]\(distributed-queues\/\)/);

  const draftValidation = run(root, 'validate', 'distributed-queues');
  assert.equal(draftValidation.status, 0, draftValidation.stderr);
  assert.match(draftValidation.stderr, /unfinished TODO markers/);

  const jsonValidation = run(root, 'validate', 'distributed-queues', '--json');
  assert.equal(jsonValidation.status, 0, jsonValidation.stderr);
  const jsonReport = JSON.parse(jsonValidation.stdout);
  assert.equal(jsonReport.ok, true);
  assert.equal(jsonReport.topics[0].slug, 'distributed-queues');
  assert.ok(jsonReport.warnings.length > 0);

  const duplicate = run(root, 'new', 'distributed queues', '--mode', 'quick');
  assert.equal(duplicate.status, 2);
  assert.match(duplicate.stderr, /already exists/);

  const strict = run(root, 'validate', 'distributed-queues', '--strict');
  assert.equal(strict.status, 1);
  assert.match(strict.stderr, /strict validation requires status "validated"/);

  const readmePath = join(topic, 'README.md');
  writeFileSync(readmePath, `${readFileSync(readmePath, 'utf8')}\n[Broken](missing.md)\n`);
  const broken = run(root, 'validate', 'distributed-queues');
  assert.equal(broken.status, 1);
  assert.match(broken.stderr, /broken local link: missing\.md/);
});

test('uses mode-specific research profiles', (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const created = run(root, 'new', 'Small Topic', '--mode', 'quick');
  assert.equal(created.status, 0, created.stderr);
  const topic = join(root, 'docs/small-topic');
  for (const file of ['README.md', 'research-plan.md', 'revision.md', 'sources.md']) {
    assert.equal(existsSync(join(topic, file)), true, `${file} should be part of the quick profile`);
  }
  for (const file of ['implementation.md', 'exercises.md', 'repositories.md']) {
    assert.equal(existsSync(join(topic, file)), false, `${file} should not be forced into a quick topic`);
  }
  assert.match(readFileSync(join(topic, 'README.md'), 'utf8'), /mode: "quick"/);
  const validation = run(root, 'validate', 'small-topic');
  assert.equal(validation.status, 0, validation.stderr);
});

test('rejects unsafe slugs without writing outside docs', (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const result = run(root, 'new', 'Unsafe', '--slug', '../outside');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /invalid topic slug/);
  assert.equal(existsSync(join(root, 'outside')), false);
});

test('doctor is read-only and reports index drift without repairing it', (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  assert.equal(run(root, 'new', 'Queues', '--mode', 'deep').status, 0);

  // Make the index stale without running `index`.
  const indexPath = join(root, 'docs/README.md');
  const stale = readFileSync(indexPath, 'utf8').replace(/(?=\n<!-- DEEP_LEARN_INDEX_END -->)/, '\n<!-- removed -->');
  writeFileSync(indexPath, stale);
  const before = readFileSync(indexPath, 'utf8');

  const doctor = run(root, 'doctor');
  assert.equal(doctor.status, 1);
  assert.match(doctor.stderr, /knowledge index is stale/);

  // The command must not have written anything.
  assert.equal(readFileSync(indexPath, 'utf8'), before, 'doctor must not modify files');

  const check = run(root, 'sync', '--check');
  assert.equal(check.status, 1);
  assert.match(check.stderr, /knowledge index is stale/);
  assert.equal(readFileSync(indexPath, 'utf8'), before, 'sync --check must not modify files');

  assert.equal(run(root, 'index').status, 0);
  assert.equal(run(root, 'sync', '--check').status, 0);
});

test('doctor reports orphan learning pages and orphan coverage maps', (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  mkdirSync(join(root, 'src/content/docs/topic'), { recursive: true });
  mkdirSync(join(root, '.agents/coverage'), { recursive: true });
  cpSync(join(repositoryRoot, '.agents/config.json'), join(root, '.agents/config.json'));
  writeFileSync(
    join(root, 'src/content/docs/topic/index.mdx'),
    '---\ntitle: Topic\nlearning:\n  id: topic\n  researchSlug: gone-topic\n---\n',
  );
  writeFileSync(join(root, '.agents/coverage/gone-topic.md'), '# stale coverage\n');

  const doctor = run(root, 'doctor');
  assert.equal(doctor.status, 1);
  assert.match(doctor.stderr, /orphan learning page for research topic "gone-topic"/);
  assert.match(doctor.stderr, /orphan coverage map for research topic "gone-topic"/);
});

test('doctor keeps the harness canonical in .agents', () => {
  assert.equal(existsSync(join(repositoryRoot, '.doty')), false);
  assert.equal(existsSync(join(repositoryRoot, '.agent')), false);
  const result = run(repositoryRoot, 'doctor', '--json');
  const report = JSON.parse(result.stdout);
  assert.deepEqual(report.findings.filter((finding) => finding.category === 'harness'), []);
});

test('doctor reports config keys that no code consumes', (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const configPath = join(root, '.agents/config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.validation.totallyUnreadKey = true;
  writeFileSync(configPath, JSON.stringify(config, null, 2));

  const doctor = run(root, 'doctor');
  assert.match(doctor.stderr, /validation\.totallyUnreadKey" has no consumer/);
});

test('doctor excludes archived history from the config-consumer scan', (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  // The preserved pre-consolidation snapshot repeats every key name. When it was
  // inside the scan, every key matched itself and doctor reported zero dead
  // keys while 22 of 41 were unread. Two figures, measured:
  //   with history:    41 keys, 0 dead
  //   without history: 41 keys, 22 dead
  mkdirSync(join(root, '.agents/history'), { recursive: true });
  cpSync(join(root, '.agents/config.json'), join(root, '.agents/history/old-config.json'));

  const configPath = join(root, '.agents/config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.validation.keyOnlyInHistory = true;
  writeFileSync(configPath, JSON.stringify(config, null, 2));

  const doctor = run(root, 'doctor');
  assert.match(doctor.stderr, /validation\.keyOnlyInHistory" has no consumer/);

  // And the real repository must report no unread config keys at all.
  const real = run(repositoryRoot, 'doctor', '--json');
  const report = JSON.parse(real.stdout);
  const configWarnings = report.findings.filter((f) => f.category === 'config');
  assert.deepEqual(
    configWarnings,
    [],
    `unread config keys: ${configWarnings.map((f) => f.message).join('; ')}`,
  );
});

/**
 * The real repository must be clean.
 *
 * Every gate is checked against the live tree rather than a fixture, so a change
 * that makes the harness inconsistent fails here instead of three sessions later.
 */
test('the real repository passes doctor with no errors', () => {
  const result = run(repositoryRoot, 'doctor', '--json');
  const report = JSON.parse(result.stdout);
  const errors = report.findings.filter((finding) => finding.level === 'error');
  assert.deepEqual(errors, [], errors.map((finding) => `${finding.category}: ${finding.message}`).join('\n'));
});

test('every skill is well formed and reachable from the router', () => {
  const result = run(repositoryRoot, 'doctor', '--json');
  const report = JSON.parse(result.stdout);
  const problems = report.findings.filter(
    (finding) => ['skill', 'router', 'glossary'].includes(finding.category) && finding.level === 'error',
  );
  assert.deepEqual(problems, [], problems.map((finding) => finding.message).join('\n'));

  // Descriptions are the only skill text every session pays for, so they stay
  // short and front-loaded. 508 characters once shipped for review-learning.
  const skillsDir = join(repositoryRoot, '.agents/skills');
  for (const entry of readdirSync(skillsDir)) {
    const skillFile = join(skillsDir, entry, 'SKILL.md');
    if (!existsSync(skillFile)) continue;
    const text = readFileSync(skillFile, 'utf8');
    const description = text.match(/^description:\s*"?([^"\n]+)"?$/m)?.[1] || '';
    assert.ok(description.length > 0, `${entry}: missing description`);
    assert.ok(description.length <= 200, `${entry}: description is ${description.length} chars`);
    assert.match(text, /^invocation:\s*(user|model)$/m, `${entry}: missing invocation`);
    assert.ok(existsSync(join(skillsDir, entry, 'agents/openai.yaml')), `${entry}: missing interface metadata`);
  }
});

test('strict validation accepts honest execution labels', (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const created = run(root, 'new', 'Honest Labels', '--mode', 'quick');
  assert.equal(created.status, 0, created.stderr);
  markValidated(root, 'honest-labels');

  // `UNVERIFIED` and `NOT EXECUTED` are the vocabulary research-policy.md
  // requires. The previous validator rejected both words, which punished an
  // author for labelling a version they could not confirm, and pushed authors
  // into vague prose instead.
  const revision = join(root, 'docs/honest-labels/revision.md');
  writeFileSync(
    revision,
    readFileSync(revision, 'utf8').replace(
      'or NOT APPLICABLE.',
      'or NOT APPLICABLE.\n\nA version I could not confirm stays `UNVERIFIED`; an unrun example stays `NOT EXECUTED`.',
    ),
  );

  const result = run(root, 'validate', 'honest-labels', '--strict');
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.doesNotMatch(result.stderr, /UNVERIFIED|NOT EXECUTED/);
});

test('strict validation rejects a validated topic whose versions are still UNVERIFIED', (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  run(root, 'new', 'Version Boundary', '--mode', 'quick');
  markValidated(root, 'version-boundary');
  // Version honesty is enforced on the field that carries the claim.
  const readme = join(root, 'docs/version-boundary/README.md');
  writeFileSync(readme, readFileSync(readme, 'utf8').replace(/^versions: "1\.0\.0"$/m, 'versions: "UNVERIFIED"'));

  const result = run(root, 'validate', 'version-boundary', '--strict');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /versions is still UNVERIFIED/);
});

test('new writes a multi-page learning design file', (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const created = run(root, 'new', 'Redis Streams', '--mode', 'deep');
  assert.equal(created.status, 0, created.stderr);

  const design = join(root, 'docs/redis-streams/learning.md');
  assert.equal(existsSync(design), true, 'learning.md is part of the atomic scaffold');
  const text = readFileSync(design, 'utf8');

  // A topic cannot be published as an unplanned single page: the design carries
  // objectives, concepts, and a page plan, all keyed by stable IDs.
  assert.match(text, /^## Objectives$/m);
  assert.match(text, /^## Concepts$/m);
  assert.match(text, /^## Page plan$/m);
  for (const objective of ['explain-core', 'trace-mechanism', 'apply-practice', 'diagnose-failure', 'evaluate-tradeoffs']) {
    assert.match(text, new RegExp(`redis-streams\\.${objective}`), `missing objective ${objective}`);
  }

  // Exactly one overview, several child pages, and unique page IDs even when a
  // kind repeats. Two `module` pages previously collided on pageId.
  const pageRows = [...text.matchAll(/^\| (\d+) \| `([a-z-]+)` \| `([^`]+)`/gm)].map((m) => ({ kind: m[2], pageId: m[3] }));
  assert.ok(pageRows.length >= 4, `expected a multi-page plan, got ${pageRows.length} pages`);
  assert.equal(pageRows.filter((row) => row.kind === 'overview').length, 1);
  assert.equal(new Set(pageRows.map((row) => row.pageId)).size, pageRows.length, 'page IDs must be unique');
  assert.ok(pageRows.some((row) => row.kind === 'practice'), 'plan includes a practice page');
  assert.ok(pageRows.some((row) => row.kind === 'review'), 'plan includes a review page');

  // The scaffold message points at the file that actually exists.
  assert.match(created.stdout, /docs\/redis-streams\/learning\.md/);

  // A topic missing its design file is a structural failure, not a nicety.
  rmSync(design);
  const missing = run(root, 'validate', 'redis-streams');
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /learning design file is missing/);
});

test('page count respects the configured bounds', (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const configPath = join(root, '.agents/config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.pagePlanning = {
    ...config.pagePlanning,
    maximumPageCount: 3,
    minimumPageCount: 3,
    kindsByMode: { ...config.pagePlanning.kindsByMode, deep: ['overview', 'module', 'deep-dive', 'practice', 'review'] },
  };
  writeFileSync(configPath, JSON.stringify(config, null, 2));

  run(root, 'new', 'Capped Topic', '--mode', 'deep');
  const text = readFileSync(join(root, 'docs/capped-topic/learning.md'), 'utf8');
  const rows = [...text.matchAll(/^\| \d+ \| `[a-z-]+` \| `[^`]+`/gm)];
  assert.equal(rows.length, 3, 'page count must be clamped to maximumPageCount');
});

test('quick mode plans a smaller page set than deep mode', (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  run(root, 'new', 'Small Topic', '--mode', 'quick');
  const small = readFileSync(join(root, 'docs/small-topic/learning.md'), 'utf8');
  const smallPages = [...small.matchAll(/^\| \d+ \| `[a-z-]+` \| `[^`]+`/gm)].length;

  run(root, 'new', 'Big Topic', '--mode', 'deep');
  const big = readFileSync(join(root, 'docs/big-topic/learning.md'), 'utf8');
  const bigPages = [...big.matchAll(/^\| \d+ \| `[a-z-]+` \| `[^`]+`/gm)].length;

  assert.ok(smallPages < bigPages, `quick (${smallPages}) should plan fewer pages than deep (${bigPages})`);
});

test('an acknowledged exception silences its orphan without hiding new ones', (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  mkdirSync(join(root, 'docs/kept-topic'), { recursive: true });
  writeFileSync(join(root, 'docs/kept-topic/README.md'), '---\ntitle: Kept\nslug: kept-topic\nstatus: draft\n---\n\n# Kept\n');
  mkdirSync(join(root, 'src/content/docs/kept'), { recursive: true });
  writeFileSync(
    join(root, 'src/content/docs/kept/index.mdx'),
    '---\ntitle: Kept\nlearning:\n  id: kept\n  category: Test\n  difficulty: beginner\n  researchSlug: kept-topic\n  updated: 2026-09-21\n---\n\n## S\n',
  );
  mkdirSync(join(root, 'src/content/docs/other'), { recursive: true });
  writeFileSync(
    join(root, 'src/content/docs/other/index.mdx'),
    '---\ntitle: Other\nlearning:\n  id: other\n  category: Test\n  difficulty: beginner\n  researchSlug: other-topic\n  updated: 2026-09-21\n---\n\n## S\n',
  );

  const before = run(root, 'doctor');
  assert.equal(before.status, 1);
  assert.match(before.stderr, /kept-topic/);
  assert.match(before.stderr, /other-topic/);

  mkdirSync(join(root, '.agents/state'), { recursive: true });
  writeFileSync(
    join(root, '.agents/state/exceptions.json'),
    JSON.stringify({
      version: 1,
      exceptions: [
        {
          id: 'kept-research-removed',
          reason: 'pre-existing user deletion, preserved not restored',
          targets: ['src/content/docs/kept/index.mdx'],
          reviewBy: '2099-01-01',
        },
      ],
    }),
  );

  const after = run(root, 'doctor');
  // The acknowledged orphan is reported as a note, not an error; the
  // unacknowledged one still fails.
  assert.match(after.stdout, /acknowledged exception "kept-research-removed"/);
  assert.doesNotMatch(after.stderr, /kept\/index\.mdx.*orphan/);
  assert.match(after.stderr, /other\/index\.mdx.*orphan/);
});
