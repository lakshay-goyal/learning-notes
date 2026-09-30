#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFrontmatter, FrontmatterError } from '../lib/frontmatter.mjs';
import { markdownLinks, localLinkTarget, unclosedFence } from '../lib/markdown.mjs';
import { LEARNING_LEVELS, PAGE_KINDS, TAXONOMY_FACETS } from '../contracts/learning-contract.mjs';

const SCRIPT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const INDEX_START = '<!-- DEEP_LEARN_INDEX_START -->';
const INDEX_END = '<!-- DEEP_LEARN_INDEX_END -->';
const MODES = new Set(['quick', 'deep', 'production', 'codebase', 'review']);
const SOURCE_TYPES = new Set([
  'OFFICIAL_DOCUMENTATION',
  'SPECIFICATION',
  'SOURCE_CODE',
  'RELEASE_NOTES',
  'SECURITY_ADVISORY',
  'ENGINEERING_BLOG',
  'RESEARCH_PAPER',
  'CASE_STUDY',
  'COMMUNITY_DISCUSSION',
  'MAINTAINER_COMMENT',
]);
const INSPECTION_STATUSES = new Set([
  'ANALYZED',
  'SOURCE_INSPECTED',
  'DISCOVERED_NOT_ANALYZED',
]);

function fail(message, code = 1) {
  console.error(`Error: ${message}`);
  process.exit(code);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`cannot read ${path}: ${error.message}`);
  }
}

function takeOption(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) fail(`${name} requires a value`);
  args.splice(index, 2);
  return value;
}

function takeFlag(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return false;
  args.splice(index, 1);
  return true;
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizedTitle(value) {
  return value.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function assertSafeSlug(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fail(`invalid topic slug "${slug}"; use lowercase letters, digits, and single hyphens`);
  }
}

function assertInside(parent, child) {
  const rel = relative(resolve(parent), resolve(child));
  if (rel === '' || rel.startsWith(`..${sep}`) || rel === '..' || resolve(rel) === rel) {
    fail(`unsafe path outside ${parent}: ${child}`);
  }
}

function parseFrontmatter(content, file) {
  // Shared parser: .agents/lib/frontmatter.mjs. The previous local version was
  // line-based and silently dropped arrays and nested values.
  try {
    return readFrontmatter(content, { file });
  } catch (error) {
    if (error instanceof FrontmatterError) fail(error.message);
    throw error;
  }
}

function topicRecords(docsDir) {
  if (!existsSync(docsDir)) return [];
  const records = [];
  for (const entry of readdirSync(docsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const readme = join(docsDir, entry.name, 'README.md');
    if (!existsSync(readme)) continue;
    const metadata = parseFrontmatter(readFileSync(readme, 'utf8'), readme);
    records.push({
      slug: entry.name,
      title: metadata.title || entry.name,
      mode: metadata.mode || 'unknown',
      status: metadata.status || 'unknown',
      updated: metadata.updated || 'unknown',
      metadata,
    });
  }
  return records.sort((a, b) => a.title.localeCompare(b.title));
}

function renderTemplate(content, values) {
  return content.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => values[key] ?? match);
}

function updateIndex(root, config, quiet = false) {
  const docsDir = resolve(root, config.outputDirectory);
  const indexPath = join(docsDir, 'README.md');
  if (!existsSync(indexPath)) fail(`knowledge index not found: ${indexPath}`);
  const current = readFileSync(indexPath, 'utf8');
  const start = current.indexOf(INDEX_START);
  const end = current.indexOf(INDEX_END);
  if (start === -1 || end === -1 || end < start) {
    fail(`index markers are missing or out of order in ${indexPath}`);
  }

  const records = topicRecords(docsDir);
  let generated = '\n\n_No topics yet._\n\n';
  if (records.length > 0) {
    const rows = records.map(
      (record) =>
        `| [${record.title}](${record.slug}/) | \`${record.mode}\` | \`${record.status}\` | ${record.updated} |`,
    );
    generated = `\n\n| Topic | Mode | Status | Updated |\n| --- | --- | --- | --- |\n${rows.join('\n')}\n\n`;
  }

  const next = `${current.slice(0, start + INDEX_START.length)}${generated}${current.slice(end)}`;
  if (next !== current) writeFileSync(indexPath, next);
  if (!quiet) console.log(`Indexed ${records.length} topic(s) in ${relative(root, indexPath)}.`);
}

function newTopic(root, config, args) {
  const topic = args.shift();
  if (!topic || topic.startsWith('--')) fail('new requires a quoted topic name');
  const requestedSlug = takeOption(args, '--slug');
  const mode = (takeOption(args, '--mode') || config.defaultMode || 'deep').toLowerCase();
  const includeRepository = takeFlag(args, '--with-repository-analysis') || mode === 'codebase';
  if (args.length) fail(`unknown argument(s): ${args.join(' ')}`);
  if (!MODES.has(mode)) fail(`unsupported mode "${mode}"; choose ${[...MODES].join(', ')}`);

  const slug = requestedSlug || slugify(topic);
  if (!slug) fail('topic name does not produce a usable slug');
  assertSafeSlug(slug);

  const docsDir = resolve(root, config.outputDirectory);
  const topicDir = resolve(docsDir, slug);
  assertInside(docsDir, topicDir);

  const duplicate = topicRecords(docsDir).find(
    (record) => record.slug === slug || normalizedTitle(record.title) === normalizedTitle(topic),
  );
  if (duplicate || existsSync(topicDir)) {
    const existing = duplicate?.slug || slug;
    console.error(`Topic already exists at ${relative(root, join(docsDir, existing))}; update it instead.`);
    process.exit(2);
  }

  const profile = config.requiredCoreFilesByMode?.[mode] || config.requiredCoreFiles || [
    'README.md',
    'research-plan.md',
    'sources.md',
    'revision.md',
  ];
  const templateNames = new Map([
    ['README.md', mode === 'deep' || mode === 'production' || mode === 'codebase' ? 'lesson.md' : 'lesson-lite.md'],
    ['research-plan.md', 'research-plan.md'],
    ['implementation.md', 'implementation.md'],
    ['exercises.md', 'exercises.md'],
    ['revision.md', 'revision.md'],
    ['sources.md', 'sources.md'],
    ['repositories.md', 'repository-analysis.md'],
  ]);
  const requestedFiles = [...new Set([...profile, ...(includeRepository ? ['repositories.md'] : [])])];
  const unknownFile = requestedFiles.find((outputName) => !templateNames.has(outputName));
  if (unknownFile) fail(`mode "${mode}" has an unknown required file: ${unknownFile}`);
  const files = requestedFiles.map((outputName) => [templateNames.get(outputName), outputName]);

  const date = new Date().toISOString().slice(0, 10);
  const values = { TOPIC: topic.trim(), SLUG: slug, MODE: mode, DATE: date };
  const rendered = files.map(([templateName, outputName]) => {
    const templatePath = join(root, config.researchTemplateDirectory || '.agents/templates/research', templateName);
    if (!existsSync(templatePath)) fail(`required template not found: ${templatePath}`);
    return [outputName, renderTemplate(readFileSync(templatePath, 'utf8'), values)];
  });

  // Render and validate every file before creating the final topic directory.
  // A sibling temporary directory keeps a failed scaffold from becoming an
  // invisible half-topic that the index and doctor cannot discover.
  const temporaryDir = `${topicDir}.tmp-${process.pid}-${Date.now()}`;
  try {
    mkdirSync(temporaryDir, { recursive: false });
    for (const [outputName, content] of rendered) {
      writeFileSync(join(temporaryDir, outputName), content);
    }
    renameSync(temporaryDir, topicDir);
  } catch (error) {
    rmSync(temporaryDir, { recursive: true, force: true });
    throw error;
  }

  updateIndex(root, config, true);
  console.log(`Created ${relative(root, topicDir)} in ${mode} mode (${rendered.length} Markdown files).`);
}

function walkFiles(path) {
  const files = [];
  if (!existsSync(path)) return files;
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(child));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}

function validate(root, config, args) {
  const strict = takeFlag(args, '--strict');
  const json = takeFlag(args, '--json');
  const all = takeFlag(args, '--all');
  const requested = args.shift();
  if (args.length) fail(`unknown argument(s): ${args.join(' ')}`);
  if (all && requested) fail('choose either a topic slug or --all');

  const docsDir = resolve(root, config.outputDirectory);
  if (!existsSync(docsDir)) fail(`output directory not found: ${docsDir}`);
  const indexPath = join(docsDir, 'README.md');
  const records = topicRecords(docsDir);
  let selected = records;
  if (!all && requested) {
    assertSafeSlug(requested);
    selected = records.filter((record) => record.slug === requested);
    if (!selected.length) fail(`topic not found: ${requested}`);
  }

  const errors = [];
  const warnings = [];
  const report = (kind, file, message) => {
    const item = `${relative(root, file)}: ${message}`;
    (kind === 'error' ? errors : warnings).push(item);
  };

  if (!existsSync(indexPath)) {
    errors.push(`${relative(root, indexPath)}: central knowledge index is missing`);
  } else {
    const index = readFileSync(indexPath, 'utf8');
    if (!index.includes(INDEX_START) || !index.includes(INDEX_END)) {
      report('error', indexPath, 'DeepLearn index markers are missing');
    }
    for (const record of records) {
      if (!index.includes(`(${record.slug}/)`)) {
        report('error', indexPath, `missing topic entry for ${record.slug}`);
      }
    }
  }

  if (config.validation?.failOnNonMarkdownLearningFiles) {
    for (const file of walkFiles(docsDir)) {
      if (extname(file).toLowerCase() !== '.md') {
        const rel = relative(docsDir, file).split(sep).join('/');
        if (/^[^/]+\/review\/[^/]+\.html$/.test(rel)) continue;
        report('error', file, 'learning artifacts under docs must be Markdown');
      }
    }
  }

  const duplicateKeys = new Map();
  for (const record of records) {
    const key = normalizedTitle(record.title);
    if (duplicateKeys.has(key)) {
      errors.push(`duplicate topic title: ${record.title} (${duplicateKeys.get(key)} and ${record.slug})`);
    } else duplicateKeys.set(key, record.slug);
  }

  const filesToCheck = new Set(existsSync(indexPath) ? [indexPath] : []);
  for (const record of selected) {
    const topicDir = join(docsDir, record.slug);
    const requiredFiles = config.requiredCoreFilesByMode?.[record.mode] || config.requiredCoreFiles || [];
    for (const required of requiredFiles) {
      const path = join(topicDir, required);
      if (!existsSync(path)) report('error', path, 'required topic file is missing');
    }

    const readme = join(topicDir, 'README.md');
    const content = readFileSync(readme, 'utf8');
    const metadata = parseFrontmatter(content, readme);
    if (metadata.slug !== record.slug) report('error', readme, `frontmatter slug must be "${record.slug}"`);
    if (!metadata.title) report('error', readme, 'frontmatter title is missing');
    if (!MODES.has(metadata.mode)) report('error', readme, `frontmatter mode "${metadata.mode}" is invalid`);
    if (!['draft', 'researched', 'validated', 'needs-refresh'].includes(metadata.status)) {
      report('error', readme, `frontmatter status "${metadata.status}" is invalid`);
    }
    if (strict && metadata.status !== 'validated') {
      report('error', readme, `strict validation requires status "validated", found "${metadata.status}"`);
    }

    for (const file of walkFiles(topicDir).filter((path) => extname(path).toLowerCase() === '.md')) {
      filesToCheck.add(file);
      const markdown = readFileSync(file, 'utf8');
      if (strict) {
        const unfinished = [
          /\{\{[A-Z_]+\}\}/,
          /<!--\s*TODO(?::|\s|--)/i,
          /\bUNVERIFIED\b/,
          /\bNOT RUN\b/,
          /example\.invalid/,
          /Replace with source title/i,
        ].find((pattern) => pattern.test(markdown));
        if (unfinished) report('error', file, `unfinished scaffold marker matched ${unfinished}`);
      } else if (/<!--\s*TODO(?::|\s|--)/i.test(markdown)) {
        report('warning', file, 'contains unfinished TODO markers');
      }
    }

    const plan = join(topicDir, 'research-plan.md');
    if (strict && existsSync(plan) && /^\|\s*OPEN\s*\|/m.test(readFileSync(plan, 'utf8'))) {
      report('error', plan, 'strict validation requires every research question to be resolved, partial, or blocked');
    }

    const sources = join(topicDir, 'sources.md');
    if (strict && existsSync(sources)) {
      const sourceContent = readFileSync(sources, 'utf8');
      if (!/^## Source\s+\d+\s+—\s+\[[^\]]+\]\(https?:\/\//m.test(sourceContent)) {
        report('error', sources, 'no structured source entry with an HTTP(S) URL found');
      }
      const types = [...sourceContent.matchAll(/^- Source type:\s*`([^`]+)`/gm)].map((match) => match[1]);
      if (!types.length || types.some((type) => !SOURCE_TYPES.has(type))) {
        report('error', sources, 'source entries must use recognized source types');
      }
      const statuses = [...sourceContent.matchAll(/^- Inspection status:\s*`([^`]+)`/gm)].map(
        (match) => match[1],
      );
      if (!statuses.length || statuses.some((status) => !INSPECTION_STATUSES.has(status))) {
        report('error', sources, 'source entries must use recognized inspection statuses');
      }
    }
  }

  for (const file of filesToCheck) {
    const content = readFileSync(file, 'utf8');
    const openFence = unclosedFence(content);
    if (openFence) report('error', file, `unclosed ${openFence.marker} fence opened on line ${openFence.line}`);
    for (const rawLink of markdownLinks(content)) {
      const target = localLinkTarget(rawLink);
      if (!target) continue;
      const absolute = target.startsWith('/') ? resolve(root, `.${target}`) : resolve(dirname(file), target);
      if (!existsSync(absolute)) report('error', file, `broken local link: ${rawLink}`);
    }
  }

  const result = {
    ok: errors.length === 0,
    topics: selected.map((record) => ({ slug: record.slug, mode: record.mode, status: record.status })),
    errors,
    warnings,
  };
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    if (errors.length) process.exit(1);
    return;
  }

  for (const warning of warnings) console.warn(`Warning: ${warning}`);
  for (const error of errors) console.error(`Error: ${error}`);
  if (errors.length) {
    console.error(`Validation failed with ${errors.length} error(s) and ${warnings.length} warning(s).`);
    process.exit(1);
  }
  console.log(`Validation passed for ${selected.length} topic(s) with ${warnings.length} warning(s).`);
}

/**
 * Render the knowledge index exactly as `updateIndex` would, without writing.
 * Used by `sync --check` and by `doctor` to detect index drift.
 */
function renderIndex(root, config) {
  const docsDir = resolve(root, config.outputDirectory);
  const indexPath = join(docsDir, 'README.md');
  if (!existsSync(indexPath)) return { indexPath, expected: undefined, current: undefined };
  const current = readFileSync(indexPath, 'utf8');
  const start = current.indexOf(INDEX_START);
  const end = current.indexOf(INDEX_END);
  if (start === -1 || end === -1 || end < start) {
    return { indexPath, expected: undefined, current, malformed: true };
  }
  const records = topicRecords(docsDir);
  let generated = '\n\n_No topics yet._\n\n';
  if (records.length > 0) {
    const rows = records.map(
      (record) =>
        `| [${record.title}](${record.slug}/) | \`${record.mode}\` | \`${record.status}\` | ${record.updated} |`,
    );
    generated = `\n\n| Topic | Mode | Status | Updated |\n| --- | --- | --- | --- |\n${rows.join('\n')}\n\n`;
  }
  return {
    indexPath,
    current,
    expected: `${current.slice(0, start + INDEX_START.length)}${generated}${current.slice(end)}`,
    topicCount: records.length,
  };
}

function sync(root, config, args) {
  const check = takeFlag(args, '--check');
  if (args.length) fail(`unknown argument(s): ${args.join(' ')}`);
  if (check) {
    const { indexPath, expected, current, malformed } = renderIndex(root, config);
    if (malformed) {
      fail(`index markers are missing or out of order in ${relative(root, indexPath)}`);
    }
    if (expected === undefined) {
      fail(`knowledge index not found: ${indexPath}`);
    }
    if (expected === current) {
      console.log(`Knowledge index is up to date: ${relative(root, indexPath)}`);
      return;
    }
    console.error(`Error: knowledge index is stale: ${relative(root, indexPath)}`);
    console.error('Run `node .agents/bin/deep-learn.mjs index` to regenerate it.');
    process.exit(1);
  }
  updateIndex(root, config);
}

/**
 * Keys declared in a config file that appear nowhere in the source tree outside
 * that config file. A declared key with no consumer is a documentation claim
 * that the code does not enforce.
 */
function unconsumedConfigKeys(root, configPath, config) {
  const haystack = [];
  const scan = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === '.astro') {
        continue;
      }
      const child = join(dir, entry.name);
      if (entry.isDirectory()) scan(child);
      else if (/\.(mjs|js|ts|tsx|astro|mjs|md|json)$/.test(entry.name) && child !== configPath) {
        haystack.push(readFileSync(child, 'utf8'));
      }
    }
  };
  for (const dir of ['.agents', 'scripts', 'src']) {
    const path = join(root, dir);
    if (existsSync(path)) scan(path);
  }
  const corpus = haystack.join('\n');

  // Walk nested config objects into [dottedPath, bareKey] pairs.
  const flatten = (value, prefix = '') => {
    const out = [];
    for (const [key, nested] of Object.entries(value)) {
      if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        out.push(...flatten(nested, `${prefix}${key}.`));
      } else {
        out.push([`${prefix}${key}`, key]);
      }
    }
    return out;
  };

  return flatten(config)
    .filter(([, bare]) => {
      const escaped = bare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return !new RegExp(`\\b${escaped}\\b`).test(corpus);
    })
    .map(([dotted]) => dotted);
}

/**
 * Validate the single-home harness layout and active references.
 *
 * This is intentionally a doctor check, not a repair: a second methodology
 * root or a broken link inside the active `.agents/` tree is a design failure,
 * not something to silently paper over. Historical snapshots are excluded
 * because they are allowed to describe the pre-consolidation layout.
 */
function validateHarnessLayout(root, config, add) {
  const harnessRoot = resolve(root, config.harnessRoot || '.agents');
  const marker = join(harnessRoot, 'README.md');
  // Isolated test fixtures intentionally contain only the files needed by a
  // particular command. The full layout check applies to the real repository.
  if (!existsSync(marker)) return;

  const required = [
    'config.json',
    'README.md',
    'contracts/learning-contract.mjs',
    'contracts/taxonomy.mjs',
    'lib/anchors.mjs',
    'lib/frontmatter.mjs',
    'lib/markdown.mjs',
    'bin/deep-learn.mjs',
    'bin/deep-learn-visual.mjs',
    'skills/deep-learn/SKILL.md',
    'skills/deep-learn-visual/SKILL.md',
    'skills/review-learning/SKILL.md',
    'methodology/research/topic-research.md',
    'policies/research-policy.md',
    'workflows/research.md',
    'rules/content-coverage.md',
    'registry/taxonomy.json',
    'templates/research/lesson.md',
    'templates/research/lesson-lite.md',
    'templates/visual/topic.mdx',
    'templates/visual/module.mdx',
    'evals/acceptance-tests.md',
  ];
  for (const relativePath of required) {
    const file = join(harnessRoot, relativePath);
    if (!existsSync(file)) add('error', 'harness', `missing canonical harness file: ${relative(root, file)}`);
  }

  for (const legacy of ['.doty', '.agent']) {
    const legacyRoot = join(root, legacy);
    if (existsSync(legacyRoot)) {
      add('error', 'harness', `legacy harness root still exists: ${legacy}/; migrate its contents into ${config.harnessRoot || '.agents'}/`);
    }
  }

  const activeFiles = walkFiles(harnessRoot).filter((file) => {
    const relativePath = relative(harnessRoot, file);
    return !relativePath.startsWith(`history${sep}`) && /\.(md|mdx|mjs|json)$/i.test(file);
  });
  const legacyReference = /(?:\.doty\/|\.agent\/|scripts\/lib\/|node scripts\/deep-learn(?:-visual)?\.mjs)/;
  for (const file of activeFiles) {
    const relativePath = relative(harnessRoot, file);
    const content = readFileSync(file, 'utf8');
    if (relativePath !== 'README.md' && legacyReference.test(content)) {
      add('error', 'harness', `active harness file contains a legacy path: ${relative(root, file)}`);
    }
    if (
      (extname(file).toLowerCase() === '.md' || extname(file).toLowerCase() === '.mdx') &&
      !relativePath.startsWith(`templates${sep}`)
    ) {
      for (const rawLink of markdownLinks(content)) {
        const target = localLinkTarget(rawLink);
        if (!target) continue;
        const absolute = target.startsWith('/') ? resolve(root, `.${target}`) : resolve(dirname(file), target);
        if (!existsSync(absolute)) {
          add('error', 'harness', `broken local link in ${relative(root, file)}: ${rawLink}`);
        }
      }
    }
  }
}

/**
 * Read-only diagnostics. Reports inconsistent state; never repairs it.
 *
 *   - stale knowledge index rows
 *   - research topics with no learning pages (legal, reported as research-only)
 *   - orphan learning pages (a research topic that no longer exists)
 *   - orphan coverage maps
 *   - config keys with no consumer
 */
function doctor(root, config, args) {
  const json = takeFlag(args, '--json');
  if (args.length) fail(`unknown argument(s): ${args.join(' ')}`);

  const findings = [];
  const add = (level, category, message) => findings.push({ level, category, message });
  validateHarnessLayout(root, config, add);

  const docsDir = resolve(root, config.outputDirectory);

  // 1. Index drift.
  const index = renderIndex(root, config);
  if (index.malformed) add('error', 'index', `index markers are missing or out of order in ${relative(root, index.indexPath)}`);
  else if (index.expected === undefined) add('error', 'index', `knowledge index not found: ${index.indexPath}`);
  else if (index.expected !== index.current) add('error', 'index', `knowledge index is stale: run \`node .agents/bin/deep-learn.mjs index\``);

  // 2. Research topics vs learning pages.
  const agentConfig = config;
  const researchSlugs = new Set(topicRecords(docsDir).map((record) => record.slug));
  const learningDir = agentConfig ? resolve(root, agentConfig.learningDirectory) : null;

  const pages = [];
  if (learningDir) {
    for (const file of walkFiles(learningDir)) {
      if (!['.md', '.mdx'].includes(extname(file).toLowerCase())) continue;
      const content = readFileSync(file, 'utf8');
      let data;
      try {
        data = readFrontmatter(content, { file });
      } catch (error) {
        if (error instanceof FrontmatterError) {
          add('error', 'frontmatter', error.message);
          continue;
        }
        throw error;
      }
      if (!data.learning) continue;
      pages.push({ file, data: data.learning });
    }
  }

  const publishedSlugs = new Set();
  for (const page of pages) {
    const slug = page.data.researchSlug;
    if (typeof slug !== 'string' || !slug) {
      add('error', 'orphan', `${relative(root, page.file)}: learning.researchSlug is missing`);
      continue;
    }
    publishedSlugs.add(slug);
    if (!researchSlugs.has(slug)) {
      add(
        'error',
        'orphan',
        `${relative(root, page.file)}: orphan learning page for research topic "${slug}", which has no docs/${slug}/README.md`,
      );
    }
  }

  for (const slug of researchSlugs) {
    if (!publishedSlugs.has(slug)) {
      add('info', 'publication', `"${slug}" is research-only: validated research with no learning pages yet`);
    }
  }

  // 3. Orphan coverage maps.
  if (agentConfig) {
    const coverageDir = resolve(root, agentConfig.coverageDirectory);
    for (const file of walkFiles(coverageDir).filter((path) => path.endsWith('.md'))) {
      const slug = file.slice(coverageDir.length + 1, -3);
      if (!researchSlugs.has(slug)) {
        add(
          'error',
          'orphan',
          `${relative(root, file)}: orphan coverage map for research topic "${slug}", which does not exist`,
        );
      }
    }
  }

  // 4. Config keys with no consumer.
  for (const key of unconsumedConfigKeys(root, configPath, config)) {
    add('warning', 'config', `.agents/config.json key "${key}" has no consumer in .agents/, scripts/, or src/`);
  }

  const errors = findings.filter((f) => f.level === 'error').length;
  const warnings = findings.filter((f) => f.level === 'warning').length;
  if (json) {
    console.log(JSON.stringify({ ok: errors === 0, findings }, null, 2));
    if (errors) process.exit(1);
    return;
  }

  for (const finding of findings) {
    const line = `${finding.level === 'error' ? 'Error' : finding.level === 'warning' ? 'Warning' : 'Note'} [${finding.category}]: ${finding.message}`;
    if (finding.level === 'error') console.error(line);
    else if (finding.level === 'warning') console.warn(line);
    else console.log(line);
  }
  if (errors) {
    console.error(`Doctor found ${errors} error(s) and ${warnings} warning(s). No files were changed.`);
    process.exit(1);
  }
  console.log(`Doctor found no errors (${warnings} warning(s), ${findings.length} note(s)). No files were changed.`);
}

function printHelp() {
  console.log(`${harnessName} harness (${harnessRoot}/)`);
  console.log(`Usage:
  node .agents/bin/deep-learn.mjs new "<topic>" [--mode <mode>] [--slug <slug>] [--with-repository-analysis]
  node .agents/bin/deep-learn.mjs index
  node .agents/bin/deep-learn.mjs sync [--check]
  node .agents/bin/deep-learn.mjs doctor [--json]
  node .agents/bin/deep-learn.mjs validate <slug> [--strict] [--json]
  node .agents/bin/deep-learn.mjs validate --all [--strict] [--json]

Modes: quick, deep, production, codebase, review

\`doctor\` and \`sync --check\` are read-only and never repair state.

The internal --root <path> option supports isolated harness tests.`);
}

const args = process.argv.slice(2);
const root = resolve(takeOption(args, '--root') || SCRIPT_ROOT);
const configPath = join(root, '.agents/config.json');
if (!existsSync(configPath)) fail(`DeepLearn config not found: ${configPath}`);
const config = readJson(configPath);
const harnessName = config.harnessName || 'learning-harness';
const harnessRoot = config.harnessRoot || '.agents';
const command = args.shift();

switch (command) {
  case 'new':
    newTopic(root, config, args);
    break;
  case 'index':
    if (args.length) fail(`unknown argument(s): ${args.join(' ')}`);
    updateIndex(root, config);
    break;
  case 'sync':
    sync(root, config, args);
    break;
  case 'doctor':
    doctor(root, config, args);
    break;
  case 'validate':
    validate(root, config, args);
    break;
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    printHelp();
    break;
  default:
    fail(`unknown command "${command}"; run with --help`);
}
