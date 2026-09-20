#!/usr/bin/env node

import {
  existsSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VALID_COVERAGE_STATUSES = new Set(['MAPPED', 'INTENTIONALLY_EXCLUDED']);

function fail(message, code = 1) {
  console.error(`Error: ${message}`);
  process.exit(code);
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

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`cannot read ${path}: ${error.message}`);
  }
}

function assertSafeSlug(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fail(`invalid topic slug "${slug}"; use lowercase letters, digits, and single hyphens`);
  }
}

function assertInside(parent, child) {
  const rel = relative(resolve(parent), resolve(child));
  if (rel === '' || rel === '..' || rel.startsWith(`..${sep}`) || resolve(rel) === rel) {
    fail(`unsafe path outside ${parent}: ${child}`);
  }
}

function walkFiles(path) {
  if (!existsSync(path)) return [];
  const files = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(child));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}

function frontmatter(content) {
  return content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] ?? '';
}

function scalarFromFrontmatter(content, key) {
  const match = frontmatter(content).match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm'));
  return match?.[1].trim();
}

function learningMetadata(content) {
  const yaml = frontmatter(content);
  const learning = yaml.match(/^learning:\s*\n((?:[ \t]+.*(?:\r?\n|$))*)/m)?.[1] ?? '';
  const value = (key) => learning.match(new RegExp(`^\\s{2}${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm'))?.[1].trim();
  return { id: value('id'), researchSlug: value('researchSlug') };
}

function normalizeHeading(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function headingAnchor(value) {
  return normalizeHeading(value)
    .toLowerCase()
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function headings(content, min = 2, max = 2) {
  const result = [];
  const regex = /^(#{2,6})\s+(.+)$/gm;
  for (const match of content.matchAll(regex)) {
    const level = match[1].length;
    if (level >= min && level <= max) result.push({ level, text: normalizeHeading(match[2]), anchor: headingAnchor(match[2]) });
  }
  return result;
}

function topicSlugs(root, config) {
  const researchDir = resolve(root, config.researchDirectory);
  if (!existsSync(researchDir)) return [];
  return readdirSync(researchDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(researchDir, entry.name, 'README.md')))
    .map((entry) => entry.name)
    .sort();
}

function learningRecords(root, config) {
  const learningDir = resolve(root, config.learningDirectory);
  return walkFiles(learningDir)
    .filter((file) => ['.md', '.mdx'].includes(extname(file).toLowerCase()))
    .map((file) => {
      const content = readFileSync(file, 'utf8');
      return { file, content, ...learningMetadata(content) };
    })
    .filter((record) => record.id || record.researchSlug);
}

function parseCoverage(content) {
  const rows = [];
  for (const line of content.split(/\r?\n/)) {
    if (!line.startsWith('|')) continue;
    const cells = line.slice(1, -1).split('|').map((cell) => cell.trim());
    if (cells.length !== 6 || cells[0] === 'Source file' || /^-+$/.test(cells[0])) continue;
    rows.push({
      sourceFile: cells[0].replaceAll('`', ''),
      sourceSection: normalizeHeading(cells[1]),
      destinationFile: cells[2].replaceAll('`', ''),
      destinationAnchor: cells[3].replaceAll('`', ''),
      status: cells[4].replaceAll('`', ''),
      note: cells[5],
    });
  }
  return rows;
}

function routeExists(root, route) {
  const clean = route.split(/[?#]/)[0];
  if (clean === '/') return existsSync(join(root, 'src/content/docs/index.mdx')) || existsSync(join(root, 'src/content/docs/index.md'));
  if (clean.startsWith('/research/')) {
    const parts = clean.replace(/^\/research\//, '').replace(/\/$/, '').split('/').filter(Boolean);
    const [topic, ...rest] = parts;
    if (!topic) return false;
    const target = rest.length ? join(root, 'docs', topic, `${rest.join('/')}.md`) : join(root, 'docs', topic, 'README.md');
    return existsSync(target);
  }
  const rel = clean.replace(/^\//, '').replace(/\/$/, '');
  const candidates = [
    join(root, 'src/content/docs', rel, 'index.md'),
    join(root, 'src/content/docs', rel, 'index.mdx'),
    join(root, 'src/content/docs', `${rel}.md`),
    join(root, 'src/content/docs', `${rel}.mdx`),
  ];
  return candidates.some(existsSync);
}

function internalRoutes(content) {
  const routes = new Set();
  for (const match of content.matchAll(/\]\((\/[^)\s]+)\)/g)) routes.add(match[1]);
  for (const match of content.matchAll(/\bhref=["'](\/[^"']+)["']/g)) routes.add(match[1]);
  return [...routes];
}

function relativeImports(content) {
  return [...content.matchAll(/\bfrom\s+["'](\.[^"']+)["']/g)].map((match) => match[1]);
}

function importExists(file, specifier) {
  const base = resolve(dirname(file), specifier);
  return [base, `${base}.astro`, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.mjs`, join(base, 'index.ts')].some(existsSync);
}

function inspectTopic(root, config, slug) {
  assertSafeSlug(slug);
  const researchDir = resolve(root, config.researchDirectory, slug);
  assertInside(resolve(root, config.researchDirectory), researchDir);
  if (!existsSync(researchDir)) fail(`research topic not found: ${slug}`);
  const researchFiles = walkFiles(researchDir).filter((file) => extname(file) === '.md');
  const sourceSections = researchFiles.reduce((count, file) => count + headings(readFileSync(file, 'utf8')).length, 0);
  const learning = learningRecords(root, config).filter((record) => record.researchSlug === slug);
  const coverage = resolve(root, config.coverageDirectory, `${slug}.md`);

  console.log(`Topic: ${slug}`);
  console.log(`Research files: ${researchFiles.length}`);
  console.log(`Level-two source sections: ${sourceSections}`);
  console.log(`Learning pages: ${learning.length}`);
  for (const record of learning) console.log(`  - ${relative(root, record.file)} (id: ${record.id ?? 'missing'})`);
  console.log(`Coverage map: ${existsSync(coverage) ? relative(root, coverage) : 'missing'}`);
}

function validateTopic(root, config, slug, strict) {
  assertSafeSlug(slug);
  const errors = [];
  const warnings = [];
  const report = (kind, path, message) => (kind === 'error' ? errors : warnings).push(`${relative(root, path)}: ${message}`);
  const researchDir = resolve(root, config.researchDirectory, slug);
  const coveragePath = resolve(root, config.coverageDirectory, `${slug}.md`);
  assertInside(resolve(root, config.researchDirectory), researchDir);
  assertInside(resolve(root, config.coverageDirectory), coveragePath);

  if (!existsSync(researchDir)) {
    errors.push(`research topic not found: ${slug}`);
    return { errors, warnings, sourceSections: 0, rows: 0 };
  }

  const researchFiles = walkFiles(researchDir).filter((file) => extname(file).toLowerCase() === '.md');
  const readme = join(researchDir, 'README.md');
  if (!existsSync(readme)) report('error', readme, 'research README is missing');
  else if (strict && scalarFromFrontmatter(readFileSync(readme, 'utf8'), 'status') !== 'validated') {
    report('error', readme, 'strict visual validation requires validated research');
  }

  const pages = learningRecords(root, config).filter((record) => record.researchSlug === slug);
  if (pages.length !== 1) {
    errors.push(`expected exactly one learning page for ${slug}, found ${pages.length}`);
  }

  for (const page of pages) {
    if (!page.id) report('error', page.file, 'learning.id is missing');
    if (!page.content.includes(`/research/${slug}/`)) report('error', page.file, `must link to /research/${slug}/`);
    if (strict && /\{\{[A-Z_]+\}\}|<!--\s*TODO/i.test(page.content)) report('error', page.file, 'contains unfinished template markers');
    for (const specifier of relativeImports(page.content)) {
      if (!importExists(page.file, specifier)) report('error', page.file, `unresolved relative import: ${specifier}`);
    }
    for (const route of internalRoutes(page.content)) {
      if (!routeExists(root, route)) report('error', page.file, `unresolved internal route: ${route}`);
    }
  }

  const allRecords = learningRecords(root, config);
  const seenIds = new Map();
  for (const record of allRecords) {
    if (!record.id) continue;
    if (seenIds.has(record.id)) errors.push(`duplicate learning.id "${record.id}" in ${relative(root, seenIds.get(record.id))} and ${relative(root, record.file)}`);
    else seenIds.set(record.id, record.file);
  }

  if (!existsSync(coveragePath)) {
    report('error', coveragePath, 'coverage map is missing');
    return { errors, warnings, sourceSections: 0, rows: 0 };
  }

  const rows = parseCoverage(readFileSync(coveragePath, 'utf8'));
  const rowKeys = new Set(rows.map((row) => `${row.sourceFile}::${row.sourceSection}`));
  const sourceKeys = [];
  for (const file of researchFiles) {
    const sourceFile = relative(researchDir, file);
    for (const heading of headings(readFileSync(file, 'utf8'))) {
      const key = `${sourceFile}::${heading.text}`;
      sourceKeys.push(key);
      if (!rowKeys.has(key)) report('error', coveragePath, `unmapped source section: ${key}`);
    }
  }

  for (const row of rows) {
    const source = join(researchDir, row.sourceFile);
    if (!existsSync(source)) {
      report('error', coveragePath, `coverage row references missing source file: ${row.sourceFile}`);
      continue;
    }
    const sourceHeadings = headings(readFileSync(source, 'utf8')).map((heading) => heading.text);
    if (!sourceHeadings.includes(row.sourceSection)) report('error', coveragePath, `coverage row references missing source heading: ${row.sourceFile} :: ${row.sourceSection}`);
    if (!VALID_COVERAGE_STATUSES.has(row.status)) report('error', coveragePath, `invalid coverage status: ${row.status}`);
    if (!row.note) report('error', coveragePath, `coverage row needs a transformation/exclusion note: ${row.sourceFile} :: ${row.sourceSection}`);
    if (row.status === 'MAPPED') {
      const destination = resolve(root, row.destinationFile);
      if (!existsSync(destination)) {
        report('error', coveragePath, `mapped destination file is missing: ${row.destinationFile}`);
      } else {
        const anchors = new Set(headings(readFileSync(destination, 'utf8'), 2, 6).map((heading) => `#${heading.anchor}`));
        if (!anchors.has(row.destinationAnchor)) report('error', coveragePath, `destination anchor is missing: ${row.destinationFile}${row.destinationAnchor}`);
      }
    } else if (strict && !/outside|duplicate|workflow|metadata|scope|not applicable/i.test(row.note)) {
      report('warning', coveragePath, `review exclusion rationale: ${row.sourceFile} :: ${row.sourceSection}`);
    }
  }

  for (const key of rowKeys) {
    if (!sourceKeys.includes(key)) report('error', coveragePath, `coverage row has no matching level-two source heading: ${key}`);
  }

  return { errors, warnings, sourceSections: sourceKeys.length, rows: rows.length };
}

function runValidation(root, config, slugs, strict) {
  let errorCount = 0;
  let warningCount = 0;
  let sectionCount = 0;
  let rowCount = 0;
  for (const slug of slugs) {
    const result = validateTopic(root, config, slug, strict);
    sectionCount += result.sourceSections;
    rowCount += result.rows;
    for (const warning of result.warnings) console.warn(`Warning: ${warning}`);
    for (const error of result.errors) console.error(`Error: ${error}`);
    errorCount += result.errors.length;
    warningCount += result.warnings.length;
  }
  if (errorCount) {
    console.error(`Learning validation failed with ${errorCount} error(s) and ${warningCount} warning(s).`);
    process.exit(1);
  }
  console.log(`Learning validation passed for ${slugs.length} topic(s): ${sectionCount} source sections, ${rowCount} coverage rows, ${warningCount} warning(s).`);
}

function printHelp() {
  console.log(`DeepLearn Visual harness

Usage:
  node scripts/deep-learn-visual.mjs inspect <slug>
  node scripts/deep-learn-visual.mjs coverage <slug> [--strict]
  node scripts/deep-learn-visual.mjs validate <slug> [--strict]
  node scripts/deep-learn-visual.mjs validate --all [--strict]

The internal --root <path> option supports isolated harness tests.`);
}

const args = process.argv.slice(2);
const root = resolve(takeOption(args, '--root') || SCRIPT_ROOT);
const configPath = join(root, '.agent/config.json');
if (!existsSync(configPath)) fail(`DeepLearn Visual config not found: ${configPath}`);
const config = readJson(configPath);
const command = args.shift();

switch (command) {
  case 'inspect': {
    const slug = args.shift();
    if (!slug || args.length) fail('inspect requires exactly one topic slug');
    inspectTopic(root, config, slug);
    break;
  }
  case 'coverage': {
    const strict = takeFlag(args, '--strict');
    const slug = args.shift();
    if (!slug || args.length) fail('coverage requires exactly one topic slug');
    runValidation(root, config, [slug], strict);
    break;
  }
  case 'validate': {
    const strict = takeFlag(args, '--strict');
    const all = takeFlag(args, '--all');
    const slug = args.shift();
    if (args.length || (all && slug) || (!all && !slug)) fail('validate requires one topic slug or --all');
    const slugs = all ? topicSlugs(root, config) : [slug];
    if (!slugs.length) fail('no research topics found');
    runValidation(root, config, slugs, strict);
    break;
  }
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    printHelp();
    break;
  default:
    fail(`unknown command "${command}"; run with --help`);
}
