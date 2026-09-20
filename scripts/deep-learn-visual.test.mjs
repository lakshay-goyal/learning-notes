import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { publishedHref } from '../src/markdown/rewrite-local-markdown-links.mjs';
import globMatcher, { isMatch } from '../src/shims/browser-glob.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(repositoryRoot, 'scripts/deep-learn-visual.mjs');

function run(root, ...args) {
  return spawnSync(process.execPath, [cli, ...args, '--root', root], { encoding: 'utf8' });
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'deep-learn-visual-test-'));
  mkdirSync(join(root, '.agent/coverage'), { recursive: true });
  cpSync(join(repositoryRoot, '.agent/config.json'), join(root, '.agent/config.json'));
  mkdirSync(join(root, 'docs/sample-topic'), { recursive: true });
  mkdirSync(join(root, 'src/content/docs/sample'), { recursive: true });
  mkdirSync(join(root, 'src/components/learning'), { recursive: true });
  writeFileSync(
    join(root, 'docs/sample-topic/README.md'),
    `---\ntitle: Sample\nslug: sample-topic\nstatus: validated\n---\n\n# Sample\n\n## Mechanism\n\nSource truth.\n`,
  );
  writeFileSync(
    join(root, 'src/content/docs/sample/index.mdx'),
    `---\ntitle: Sample\nlearning:\n  id: sample-topic\n  category: Test\n  difficulty: beginner\n  researchSlug: sample-topic\n  updated: 2026-09-21\n---\n\n## Mechanism\n\n[Research](/research/sample-topic/)\n`,
  );
  writeFileSync(
    join(root, '.agent/coverage/sample-topic.md'),
    `| Source file | Source section | Destination file | Destination anchor | Status | Transformation |\n| --- | --- | --- | --- | --- | --- |\n| README.md | Mechanism | src/content/docs/sample/index.mdx | #mechanism | MAPPED | Taught directly. |\n`,
  );
  return root;
}

test('inspects and validates a mapped topic', (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const inspected = run(root, 'inspect', 'sample-topic');
  assert.equal(inspected.status, 0, inspected.stderr);
  assert.match(inspected.stdout, /Level-two source sections: 1/);

  const validated = run(root, 'validate', 'sample-topic', '--strict');
  assert.equal(validated.status, 0, validated.stderr);
  assert.match(validated.stdout, /1 source sections, 1 coverage rows/);
});

test('fails when research coverage becomes stale', (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const readme = join(root, 'docs/sample-topic/README.md');
  writeFileSync(readme, `${readFileSync(readme, 'utf8')}\n## Failure mode\n\nNew finding.\n`);
  const result = run(root, 'coverage', 'sample-topic', '--strict');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unmapped source section: README\.md::Failure mode/);
});

test('fails duplicate stable topic IDs', (t) => {
  const root = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  mkdirSync(join(root, 'src/content/docs/duplicate'), { recursive: true });
  writeFileSync(
    join(root, 'src/content/docs/duplicate/index.mdx'),
    `---\ntitle: Duplicate\nlearning:\n  id: sample-topic\n  researchSlug: another-topic\n---\n`,
  );
  const result = run(root, 'validate', 'sample-topic', '--strict');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /duplicate learning\.id/);
});

test('publishes relative Markdown links as extensionless Astro routes', () => {
  assert.equal(publishedHref('implementation.md'), 'implementation/');
  assert.equal(publishedHref('../README.md#overview'), '../#overview');
  assert.equal(publishedHref('https://example.com/guide.md'), 'https://example.com/guide.md');
  assert.equal(publishedHref('#local-section'), '#local-section');
});

test('browser-safe route globs cover plugin inclusion and exclusion patterns', () => {
  assert.equal(isMatch('ai-engineering/model-context-protocol', '**/*'), true);
  assert.equal(isMatch('/research/model-context-protocol/', '/research/**/*'), true);
  assert.equal(isMatch('/tools/git/', '/tags/**/*'), false);
  assert.equal(globMatcher([])('/tools/git/'), false);
});
