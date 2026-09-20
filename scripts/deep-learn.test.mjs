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
  mkdirSync(join(root, '.doty'), { recursive: true });
  cpSync(join(repositoryRoot, '.doty/config.json'), join(root, '.doty/config.json'));
  cpSync(join(repositoryRoot, '.doty/templates'), join(root, '.doty/templates'), { recursive: true });
  mkdirSync(join(root, 'docs'));
  cpSync(join(repositoryRoot, 'docs/README.md'), join(root, 'docs/README.md'));
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

test('rejects unsafe slugs without writing outside docs', (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const result = run(root, 'new', 'Unsafe', '--slug', '../outside');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /invalid topic slug/);
  assert.equal(existsSync(join(root, 'outside')), false);
});
