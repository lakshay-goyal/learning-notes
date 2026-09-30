import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
