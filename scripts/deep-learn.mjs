#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
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

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!field) continue;
    let value = field[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[field[1]] = value;
  }
  return result;
}

function topicRecords(docsDir) {
  if (!existsSync(docsDir)) return [];
  const records = [];
  for (const entry of readdirSync(docsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const readme = join(docsDir, entry.name, 'README.md');
    if (!existsSync(readme)) continue;
    const metadata = parseFrontmatter(readFileSync(readme, 'utf8'));
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

  const templateDir = resolve(root, '.doty/templates');
  const files = [
    ['lesson.md', 'README.md'],
    ['research-plan.md', 'research-plan.md'],
    ['implementation.md', 'implementation.md'],
    ['exercises.md', 'exercises.md'],
    ['revision.md', 'revision.md'],
    ['sources.md', 'sources.md'],
  ];
  if (includeRepository) files.push(['repository-analysis.md', 'repositories.md']);

  const date = new Date().toISOString().slice(0, 10);
  const values = { TOPIC: topic.trim(), SLUG: slug, MODE: mode, DATE: date };
  const rendered = files.map(([templateName, outputName]) => {
    const templatePath = join(templateDir, templateName);
    if (!existsSync(templatePath)) fail(`required template not found: ${templatePath}`);
    return [outputName, renderTemplate(readFileSync(templatePath, 'utf8'), values)];
  });

  mkdirSync(topicDir, { recursive: false });
  for (const [outputName, content] of rendered) {
    writeFileSync(join(topicDir, outputName), content);
  }
  updateIndex(root, config, true);
  console.log(`Created ${relative(root, topicDir)} in ${mode} mode (${rendered.length} Markdown files).`);
}

function walkFiles(path) {
  const files = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(child));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}

function checkFences(content) {
  let open;
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    const match = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (!match) continue;
    const marker = match[1][0];
    const length = match[1].length;
    if (!open) {
      open = { marker, length, line: index + 1 };
    } else if (open.marker === marker && length >= open.length && match[2].trim() === '') {
      open = undefined;
    }
  }
  return open;
}

function markdownLinksOutsideFences(content) {
  const links = [];
  let open;
  for (const line of content.split(/\r?\n/)) {
    const fence = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
    if (fence) {
      const marker = fence[1][0];
      const length = fence[1].length;
      if (!open) open = { marker, length };
      else if (open.marker === marker && length >= open.length && fence[2].trim() === '') open = undefined;
      continue;
    }
    if (open) continue;
    const regex = /!?\[[^\]]*\]\(([^)]+)\)/g;
    for (const match of line.matchAll(regex)) links.push(match[1].trim());
  }
  return links;
}

function localLinkTarget(raw) {
  let value = raw;
  if (value.startsWith('<') && value.endsWith('>')) value = value.slice(1, -1);
  if (/^(?:[a-z]+:|#|\/\/)/i.test(value)) return undefined;
  value = value.split(/\s+["']/)[0].split('#')[0].split('?')[0];
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function validate(root, config, args) {
  const strict = takeFlag(args, '--strict');
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
    for (const required of config.requiredCoreFiles || []) {
      const path = join(topicDir, required);
      if (!existsSync(path)) report('error', path, 'required topic file is missing');
    }

    const readme = join(topicDir, 'README.md');
    const content = readFileSync(readme, 'utf8');
    const metadata = parseFrontmatter(content);
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
    const openFence = checkFences(content);
    if (openFence) report('error', file, `unclosed ${openFence.marker} fence opened on line ${openFence.line}`);
    for (const rawLink of markdownLinksOutsideFences(content)) {
      const target = localLinkTarget(rawLink);
      if (!target) continue;
      const absolute = target.startsWith('/') ? resolve(root, `.${target}`) : resolve(dirname(file), target);
      if (!existsSync(absolute)) report('error', file, `broken local link: ${rawLink}`);
    }
  }

  for (const warning of warnings) console.warn(`Warning: ${warning}`);
  for (const error of errors) console.error(`Error: ${error}`);
  if (errors.length) {
    console.error(`Validation failed with ${errors.length} error(s) and ${warnings.length} warning(s).`);
    process.exit(1);
  }
  console.log(`Validation passed for ${selected.length} topic(s) with ${warnings.length} warning(s).`);
}

function printHelp() {
  console.log(`DeepLearn harness

Usage:
  node scripts/deep-learn.mjs new "<topic>" [--mode <mode>] [--slug <slug>] [--with-repository-analysis]
  node scripts/deep-learn.mjs index
  node scripts/deep-learn.mjs validate <slug> [--strict]
  node scripts/deep-learn.mjs validate --all [--strict]

Modes: quick, deep, production, codebase, review

The internal --root <path> option supports isolated harness tests.`);
}

const args = process.argv.slice(2);
const root = resolve(takeOption(args, '--root') || SCRIPT_ROOT);
const configPath = join(root, '.doty/config.json');
if (!existsSync(configPath)) fail(`DeepLearn config not found: ${configPath}`);
const config = readJson(configPath);
const command = args.shift();

switch (command) {
  case 'new':
    newTopic(root, config, args);
    break;
  case 'index':
    if (args.length) fail(`unknown argument(s): ${args.join(' ')}`);
    updateIndex(root, config);
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
