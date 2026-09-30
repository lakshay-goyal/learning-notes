#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownLinks, localLinkTarget, unclosedFence } from '../lib/markdown.mjs';
import {
  FrontmatterError,
  INSPECTION_STATUS_SET,
  RESEARCH_MODE_SET,
  RESEARCH_STATUS_SET,
  SOURCE_TYPE_SET,
  exceptionFor,
  harnessPath,
  isResearchOutputPath,
  isSafeSlug,
  loadConfig,
  loadExceptions,
  markdownFilesUnder,
  normalizedTitle,
  readFrontmatter,
  readJson,
  relPath,
  renderTemplate,
  slugify,
  topicRecords,
  walkFiles,
} from '../lib/harness.mjs';

const SCRIPT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const INDEX_START = '<!-- DEEP_LEARN_INDEX_START -->';
const INDEX_END = '<!-- DEEP_LEARN_INDEX_END -->';

/**
 * Placeholders that mean "not finished", checked in strict mode.
 *
 * `UNVERIFIED`, `NOT EXECUTED`, and `TESTED` are deliberately absent. They are
 * the honest execution vocabulary required by `research-policy.md`, and a gate
 * that banned them punished an author for labelling a version they could not
 * confirm. Honesty is enforced structurally instead: `requireVersionVerification`
 * checks the topic's own `versions` frontmatter, and the strict source check
 * requires a real URL, a justified type, and an inspection status.
 */
const UNFINISHED_MARKERS = [
  { pattern: /\{\{[A-Z_]+\}\}/, label: 'template placeholder {{TOKEN}}' },
  { pattern: /<!--\s*TODO(?::|\s|--)/i, label: 'TODO comment marker' },
  { pattern: /example\.invalid/, label: 'placeholder URL example.invalid' },
  { pattern: /Replace with source title/i, label: 'template text "Replace with source title"' },
  { pattern: /\bN\/A\b/, label: 'placeholder value "N/A"' },
];

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

function assertSafeSlug(slug) {
  if (!isSafeSlug(slug)) {
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
  if (!RESEARCH_MODE_SET.has(mode)) {
    fail(`unsupported mode "${mode}"; choose ${[...RESEARCH_MODE_SET].join(', ')}`);
  }

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

  // A topic's research profile is assembled from declared config, not hardcoded.
  // `practicalExercisesEnabled: false` must actually remove the exercise file
  // rather than leaving a dead key that changes nothing.
  let profile = config.requiredCoreFilesByMode?.[mode] || config.requiredCoreFiles || [
    'README.md',
    'research-plan.md',
    'sources.md',
    'revision.md',
  ];
  if (!config.practicalExercisesEnabled) {
    profile = profile.filter((file) => file !== 'exercises.md');
  }
  const templateNames = new Map([
    ['README.md', mode === 'deep' || mode === 'production' || mode === 'codebase' ? 'lesson.md' : 'lesson-lite.md'],
    ['research-plan.md', 'research-plan.md'],
    ['implementation.md', 'implementation.md'],
    ['exercises.md', 'exercises.md'],
    ['revision.md', 'revision.md'],
    ['sources.md', 'sources.md'],
    ['repositories.md', 'repository-analysis.md'],
  ]);
  // A repository study is capped by config rather than by a number typed into
  // the methodology prose, so `maximumPrimaryRepositories` actually bounds work.
  const repoCap = Number.isInteger(config.maximumPrimaryRepositories)
    ? config.maximumPrimaryRepositories
    : 3;
  if (includeRepository && repoCap < 1) {
    fail('maximumPrimaryRepositories must be at least 1 to use --with-repository-analysis');
  }

  const requestedFiles = [...new Set([...profile, ...(includeRepository ? ['repositories.md'] : [])])];
  const unknownFile = requestedFiles.find((outputName) => !templateNames.has(outputName));
  if (unknownFile) fail(`mode "${mode}" has an unknown required file: ${unknownFile}`);
  const files = requestedFiles.map((outputName) => [templateNames.get(outputName), outputName]);

  const date = new Date().toISOString().slice(0, 10);
  const plan = planPages(slug, topic.trim(), mode, config);
  const values = {
    TOPIC: topic.trim(),
    SLUG: slug,
    MODE: mode,
    DATE: date,
    TOPIC_ID: slug,
    PAGE_COUNT: String(plan.pages.length),
    PAGE_TABLE: renderPagePlanTable(plan),
    OBJECTIVE_COUNT: String(plan.objectives.length),
    CONCEPT_COUNT: String(plan.concepts.length),
    ACCESS_LEVELS: config.requiredLearningLevels.join(', '),
  };

  // The learning design file is generated in the same atomic scaffold as the
  // research package. It is the contract the visual stage plans against, so a
  // topic that has never been designed cannot be published as a one-page mega
  // lesson by accident.
  const designTemplateName = 'learning-design.md';
  const designTemplatePath = join(
    root,
    config.researchTemplateDirectory || '.agents/templates/research',
    designTemplateName,
  );
  const learningDesign = [
    ...files.map(([templateName, outputName]) => {
      const templatePath = join(root, config.researchTemplateDirectory || '.agents/templates/research', templateName);
      if (!existsSync(templatePath)) fail(`required template not found: ${templatePath}`);
      return [outputName, renderTemplate(readFileSync(templatePath, 'utf8'), values)];
    }),
    existsSync(designTemplatePath)
      ? [
          config.requiredLearningDesignFile,
          renderTemplate(readFileSync(designTemplatePath, 'utf8'), {
            ...values,
            OBJECTIVE_COUNT: String(plan.objectives.length),
          }),
        ]
      : [config.requiredLearningDesignFile, renderLearningDesign(plan, values)],
  ];

  // Render and validate every file before creating the final topic directory.
  // A sibling temporary directory keeps a failed scaffold from becoming an
  // invisible half-topic that the index and doctor cannot discover.
  const temporaryDir = `${topicDir}.tmp-${process.pid}-${Date.now()}`;
  try {
    mkdirSync(temporaryDir, { recursive: false });
    for (const [outputName, content] of learningDesign) {
      writeFileSync(join(temporaryDir, outputName), content);
    }
    renameSync(temporaryDir, topicDir);
  } catch (error) {
    rmSync(temporaryDir, { recursive: true, force: true });
    throw error;
  }

  updateIndex(root, config, true);
  console.log(
    `Created ${relative(root, topicDir)} in ${mode} mode ` +
      `(${learningDesign.length} Markdown files, ${plan.pages.length} planned learning pages).`,
  );
  console.log(
    `Next: edit ${relPath(root, join(topicDir, config.requiredLearningDesignFile))} — objectives and page plan — before publishing.`,
  );
}

/**
 * Build the default multi-page learning plan for a new topic.
 *
 * The old scaffolder produced one flat package and left page count to prose,
 * which is how a 3,789-word single page shipped. The plan is generated from
 * `pagePlanning.kindsByMode`, clamped to the declared bounds, and always keeps
 * exactly one overview plus focused children.
 */
function planPages(slug, title, mode, config) {
  const planning = config.pagePlanning;
  const kinds = planning.kindsByMode?.[mode] || planning.kindsByMode?.deep || ['overview', 'module', 'practice', 'review'];

  // Always exactly one overview, first.
  const ordered = ['overview', ...kinds.filter((kind) => kind !== 'overview')];
  const clamped = ordered.slice(0, Math.max(planning.minimumPageCount, Math.min(planning.maximumPageCount, ordered.length)));

  const objectives = [
    { id: 'explain-core', statement: `Explain what ${title} is, the problem it solves, and its mental model.` },
    { id: 'trace-mechanism', statement: `Trace the core mechanism of ${title} step by step, including data and control flow.` },
    { id: 'apply-practice', statement: `Build or configure a small working example of ${title}.` },
    { id: 'diagnose-failure', statement: `Diagnose a realistic failure or misuse of ${title}.` },
    { id: 'evaluate-tradeoffs', statement: `Evaluate ${title} against alternatives and state when not to use it.` },
  ];

  const concepts = [
    { id: 'mental-model', name: 'Mental model', statement: 'The smallest accurate picture that makes the rest predictable.' },
    { id: 'core-mechanism', name: 'Core mechanism', statement: 'The concrete flow that produces the behaviour.' },
    { id: 'failure-model', name: 'Failure model', statement: 'What breaks, where it surfaces, and why.' },
    { id: 'tradeoffs', name: 'Trade-offs', statement: 'Cost, limits, and the decision boundary against alternatives.' },
  ];

  // `pageId` and route must be unique per page, and a page whose `kind` repeats
  // must not collide with its sibling. Naming by kind alone produced
  // `redis-streams-module` twice for a topic with two module pages, which the
  // validator rejects as a duplicate pageId.
  const used = new Set();
  const pages = clamped.map((kind, index) => {
    const base = kind === 'overview' ? slug : `${slug}-${kind}`;
    let pageId = base;
    let suffix = 2;
    while (used.has(pageId)) pageId = `${base}-${suffix++}`;
    used.add(pageId);

    const level =
      kind === 'overview'
        ? 'quick-recall'
        : kind === 'review' || kind === 'practice'
          ? 'active-recall'
          : 'visual-understanding';

    const objectives =
      kind === 'overview'
        ? ['explain-core']
        : kind === 'practice'
          ? ['apply-practice']
          : kind === 'review'
            ? ['diagnose-failure', 'evaluate-tradeoffs']
            : ['trace-mechanism', 'evaluate-tradeoffs'];

    return {
      pageId,
      kind,
      order: index,
      level,
      slug: kind === 'overview' ? slug : `${slug}/${pageId}`,
      objectives,
      assessment:
        kind === 'review'
          ? `${slug}.consolidated-recall`
          : kind === 'practice'
            ? `${slug}.apply-check`
            : kind === 'overview'
              ? `${slug}.definition-check`
              : `${slug}.${kind}-check`,
    };
  });

  return { pages, objectives, concepts, title, mode };
}

/** Markdown table of the planned pages, embedded in the research package. */
function renderPagePlanTable(plan) {
  const rows = plan.pages.map(
    (page) =>
      `| ${page.order} | \`${page.kind}\` | \`${page.pageId}\` | ${page.level} | ${page.objectives.join(', ')} | ${page.assessment} |`,
  );
  return [
    '| Order | Kind | Page ID | Access level | Objectives | Assessment |',
    '| --- | --- | --- | --- | --- | --- |',
    ...rows,
  ].join('\n');
}

/**
 * Render `docs/<slug>/learning.md`, the machine-readable learning contract.
 *
 * This is the topic manifest `modules/05-harness-architecture.md` specifies and
 * `prompt.md` phase 1 asks for. It is generated rather than hand-written so a
 * new topic cannot ship without an objective, an assessment, and a page plan.
 */
function renderLearningDesign(plan, values) {
  const objectiveRows = plan.objectives.map((objective) => `| \`${values.TOPIC_ID}.${objective.id}\` | ${objective.statement} |`).join('\n');
  const conceptRows = plan.concepts.map((concept) => `| \`${values.TOPIC_ID}.${concept.id}\` | ${concept.name} | ${concept.statement} |`).join('\n');

  return `---
title: "Learning design: ${plan.title}"
slug: "${values.SLUG}"
topicId: "${values.TOPIC_ID}"
mode: "${values.MODE}"
status: "draft"
pageCount: ${plan.pages.length}
objectiveCount: ${plan.objectives.length}
---

# Learning design: ${plan.title}

> Generated by \`node .agents/bin/deep-learn.mjs new\`. This file is the contract the visual
> stage plans against: it defines objectives, concepts, the page set, and the assessment
> that produces evidence for each objective. Edit the statements; keep the IDs stable.

## Objectives

Observable outcomes. Every objective must be assessable by something other than recognition.

| Objective ID | Statement |
| --- | --- |
${objectiveRows}

## Concepts

| Concept ID | Name | What the learner must be able to do with it |
| --- | --- | --- |
${conceptRows}

## Page plan

One overview plus focused child pages. Split by learning job, not by section length.

${renderPagePlanTable(plan)}

## Access levels

Every topic supports all four levels, proportionate to the subject:

${config_levels(values)}

## Rules this design must satisfy

- Every page declares at least one \`objectiveIds\` entry and one \`assessmentIds\` entry.
- Every objective has at least one assessment somewhere in the topic.
- The overview carries \`level: quick-recall\`; at least one page carries \`active-recall\`.
- Page routes are stable. Renaming a page requires a migration note.
- Coverage rows map research level-two headings to a destination anchor or a
  recorded exclusion reason.

## Validation record

- Deterministic validation: NOT RUN
- Semantic review: NOT RUN
- Objective/assessment coverage: NOT RUN
`;
}

function config_levels(values) {
  return values.ACCESS_LEVELS
    .split(',')
    .map((level) => `- \`${level.trim()}\``)
    .join('\n');
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

  const rules = config.validation || {};
  const exceptions = loadExceptions(root, config);

  if (rules.requireIndexEntry) {
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
  }

  if (rules.failOnNonMarkdownLearningFiles) {
    // The review HTML exception comes from config rather than a hardcoded regex,
    // so `reviewHtmlException` is a real setting instead of a documented no-op.
    const exception = config.reviewHtmlException || 'docs/<slug>/review/*.html';
    const pattern = new RegExp(
      `^${exception.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace('<slug>', '[^/]+').replace('*', '[^/]*')}$`,
    );
    for (const file of walkFiles(docsDir)) {
      if (extname(file).toLowerCase() === '.md') continue;
      if (pattern.test(relPath(root, file))) continue;
      report('error', file, 'learning artifacts under docs must be Markdown');
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

    // The learning design file is what makes a multi-page topic plannable, so
    // its absence is a structural failure rather than a missing nice-to-have.
    if (rules.requireLearningDesignFile) {
      const design = join(topicDir, config.requiredLearningDesignFile || 'learning.md');
      if (!existsSync(design)) {
        report('error', design, 'learning design file is missing; a topic needs objectives, concepts, and a page plan');
      } else {
        const designText = readFileSync(design, 'utf8');
        const designMeta = parseFrontmatter(designText, design);
        if (designMeta.topicId !== record.slug) {
          report('error', design, `learning design topicId must be "${record.slug}"`);
        }
        for (const section of ['## Objectives', '## Page plan']) {
          if (!designText.includes(section)) {
            report('error', design, `learning design is missing the "${section.replace('## ', '')}" section`);
          }
        }
        filesToCheck.add(design);
      }
    }

    const readme = join(topicDir, 'README.md');
    const content = readFileSync(readme, 'utf8');
    const metadata = parseFrontmatter(content, readme);
    if (metadata.slug !== record.slug) report('error', readme, `frontmatter slug must be "${record.slug}"`);
    if (!metadata.title) report('error', readme, 'frontmatter title is missing');
    if (!RESEARCH_MODE_SET.has(metadata.mode)) report('error', readme, `frontmatter mode "${metadata.mode}" is invalid`);
    if (!RESEARCH_STATUS_SET.has(metadata.status)) {
      report('error', readme, `frontmatter status "${metadata.status}" is invalid; expected one of ${[...RESEARCH_STATUS_SET].join(', ')}`);
    }
    if (strict && metadata.status !== 'validated') {
      report('error', readme, `strict validation requires status "validated", found "${metadata.status}"`);
    }

    // Honesty about versions is enforced here, on the field that carries the
    // claim, rather than by banning the word `UNVERIFIED` everywhere.
    //
    // `requireVersionVerification` is read from the top level of config, where it
    // is declared, not from `validation`. Reading it from the wrong object made
    // this check permanently inert.
    if (strict && config.requireVersionVerification && metadata.status === 'validated') {
      const versions = String(metadata.versions || '').trim();
      if (!versions) {
        report('error', readme, 'frontmatter versions is missing; a validated topic must record the version boundary it targets');
      } else if (/^UNVERIFIED$/i.test(versions)) {
        report('error', readme, 'frontmatter versions is still UNVERIFIED; a validated topic must record a verified version or specification revision');
      }
    }

    for (const file of markdownFilesUnder(topicDir)) {
      filesToCheck.add(file);
      const markdown = readFileSync(file, 'utf8');
      const finished = UNFINISHED_MARKERS.find((marker) => marker.pattern.test(markdown));
      if (strict && finished) {
        report('error', file, `unfinished scaffold marker: ${finished.label}`);
      } else if (!strict && /<!--\s*TODO(?::|\s|--)/i.test(markdown)) {
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
      if (!types.length || types.some((type) => !SOURCE_TYPE_SET.has(type))) {
        report('error', sources, `source entries must use recognized source types: ${[...SOURCE_TYPE_SET].join(', ')}`);
      }
      const statuses = [...sourceContent.matchAll(/^- Inspection status:\s*`([^`]+)`/gm)].map(
        (match) => match[1],
      );
      if (!statuses.length || statuses.some((status) => !INSPECTION_STATUS_SET.has(status))) {
        report('error', sources, `source entries must use recognized inspection statuses: ${[...INSPECTION_STATUS_SET].join(', ')}`);
      }
      // A repository study is bounded by config so the cap is enforceable.
      if (config.repositoryInvestigationDepth === 'source-trace' && existsSync(join(topicDir, 'repositories.md'))) {
        const inspected = [...readFileSync(join(topicDir, 'repositories.md'), 'utf8').matchAll(/^## Repository:/gm)].length;
        const cap = Number.isInteger(config.maximumPrimaryRepositories) ? config.maximumPrimaryRepositories : 3;
        if (inspected > cap) {
          report('warning', join(topicDir, 'repositories.md'), `${inspected} repositories analyzed, above the configured maximum of ${cap}`);
        }
      }
    }
  }

  for (const file of filesToCheck) {
    const content = readFileSync(file, 'utf8');
    const openFence = unclosedFence(content);
    if (openFence) report('error', file, `unclosed ${openFence.marker} fence opened on line ${openFence.line}`);
    if (!rules.failOnBrokenLocalLinks) continue;
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
 * Config keys that no active code or documentation reads.
 *
 * A declared key with no consumer is a documentation claim the code does not
 * enforce: 22 such keys accumulated in `.agents/config.json` while `doctor`
 * reported zero warnings.
 *
 * The cause was a bug in this function. It scanned `.agents/history/`, and
 * because the preserved pre-consolidation config snapshots repeat every key
 * name, the regex always matched and the warning never fired. The same file
 * already excluded `history/` from the legacy-path check, so the exclusion was
 * simply missed here. History is excluded again, and the regression is covered
 * by `doctor excludes archived history from the config-consumer scan`.
 */
function unconsumedConfigKeys(root, config) {
  const paths = [];
  const skip = new Set(['node_modules', '.git', 'dist', '.astro', 'history']);
  const scan = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const child = join(dir, entry.name);
      if (entry.isDirectory()) scan(child);
      // The config file is excluded from its own scan by path. Filtering it out
      // of the joined text instead would be a silent no-op, because the haystack
      // holds file *contents*, which never contain the config's own path — and
      // then every declared key matches itself.
      else if (/\.(mjs|js|ts|tsx|astro|md|json)$/.test(entry.name) && child !== config.configPath) {
        paths.push(child);
      }
    }
  };
  for (const dir of [config.harnessRoot || '.agents', 'scripts', 'src']) {
    const path = resolve(root, dir);
    if (existsSync(path)) scan(path);
  }

  const haystackWithoutConfig = paths.map((file) => readFileSync(file, 'utf8')).join('\n');

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
      return !new RegExp(`\\b${escaped}\\b`).test(haystackWithoutConfig);
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
    'GLOSSARY.md',
    'PROGRESS.md',
    'features.json',
    'contracts/learning-contract.mjs',
    'contracts/research-contract.mjs',
    'contracts/taxonomy.mjs',
    'lib/anchors.mjs',
    'lib/frontmatter.mjs',
    'lib/markdown.mjs',
    'lib/harness.mjs',
    'bin/deep-learn.mjs',
    'bin/deep-learn-visual.mjs',
    'bin/harness.mjs',
    'skills/deep-learn/SKILL.md',
    'skills/deep-learn-visual/SKILL.md',
    'skills/review-learning/SKILL.md',
    'skills/explain/SKILL.md',
    'skills/verify-topic/SKILL.md',
    'skills/migrate-content/SKILL.md',
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
    if (!existsSync(file)) add('error', 'harness', `missing canonical harness file: ${relPath(root, file)}`);
  }

  for (const legacy of ['.doty', '.agent']) {
    const legacyRoot = join(root, legacy);
    if (existsSync(legacyRoot)) {
      add('error', 'harness', `legacy harness root still exists: ${legacy}/; migrate its contents into ${config.harnessRoot || '.agents'}/`);
    }
  }

  // Every skill must declare its frontmatter, its invocation mode, and a short
  // front-loaded description. These are the checks that keep the routing table
  // in AGENTS.md truthful.
  const skillsDir = join(harnessRoot, 'skills');
  if (existsSync(skillsDir)) {
    const routerRows = [];
    for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const skillFile = join(skillsDir, entry.name, 'SKILL.md');
      if (!existsSync(skillFile)) {
        add('error', 'skill', `skill directory has no SKILL.md: .agents/skills/${entry.name}/`);
        continue;
      }
      let meta;
      try {
        meta = readFrontmatter(readFileSync(skillFile, 'utf8'), { file: skillFile });
      } catch (error) {
        if (error instanceof FrontmatterError) {
          add('error', 'skill', error.message);
          continue;
        }
        throw error;
      }
      if (meta.name !== entry.name) {
        add('error', 'skill', `${relPath(root, skillFile)}: frontmatter name "${meta.name}" must match its directory "${entry.name}"`);
      }
      const description = String(meta.description || '').trim();
      if (!description) add('error', 'skill', `${relPath(root, skillFile)}: description is missing`);
      else if (description.length > 200) {
        add('warning', 'skill', `${relPath(root, skillFile)}: description is ${description.length} chars; every session pays for all descriptions, keep it near 150 and front-load the trigger`);
      }
      const invocation = String(meta.invocation || '').trim();
      if (!invocation) add('error', 'skill', `${relPath(root, skillFile)}: invocation must be "user" or "model"`);
      else if (!['user', 'model'].includes(invocation)) {
        add('error', 'skill', `${relPath(root, skillFile)}: invocation "${invocation}" is invalid; expected "user" or "model"`);
      }
      // A user-invoked skill must also be marked non-implicit for the harness,
      // or an ambiguous request can fire it.
      const interfaceFile = join(skillsDir, entry.name, 'agents/openai.yaml');
      if (!existsSync(interfaceFile)) {
        add('warning', 'skill', `${relPath(root, interfaceFile)} is missing; every skill needs interface metadata`);
      } else if (invocation === 'user') {
        const yaml = readFileSync(interfaceFile, 'utf8');
        if (!/allow_implicit_invocation:\s*false/.test(yaml)) {
          add('error', 'skill', `${relPath(root, interfaceFile)}: a user-invoked skill must set allow_implicit_invocation: false`);
        }
      }
      routerRows.push({ name: entry.name, description, invocation });
    }

    // The router in AGENTS.md is the routing table every session reads. A skill
    // it does not mention is a skill the agent cannot reliably reach.
    const agentsPath = join(root, 'AGENTS.md');
    if (existsSync(agentsPath)) {
      const agentsText = readFileSync(agentsPath, 'utf8');
      for (const row of routerRows) {
        if (!agentsText.includes(row.name)) {
          add('warning', 'router', `AGENTS.md routing table does not mention the "${row.name}" skill`);
        }
      }
    }
  }

  // The glossary keeps shared vocabulary in one file. Without it, "module"
  // means a research chapter, a page role, and a template scaffold at once.
  const glossaryPath = harnessPath(root, config, 'glossaryFile', '.agents/GLOSSARY.md');
  if (!existsSync(glossaryPath)) {
    add('error', 'glossary', `glossary is missing: ${relPath(root, glossaryPath)}`);
  } else {
    // Definition-list form used by the glossary: a bolded term on its own line
    // followed by a `:` definition line.
    const glossary = readFileSync(glossaryPath, 'utf8');
    for (const term of ['Topic', 'Page', 'Objective', 'Concept', 'Assessment', 'Learning design']) {
      const defined = new RegExp(`^\\*\\*${term}\\*\\*\\s*$|^#{2,6}\\s+.*\\b${term}\\b`, 'm').test(glossary);
      if (!defined) add('warning', 'glossary', `${relPath(root, glossaryPath)} has no definition for "${term}"`);
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
  const exceptions = loadExceptions(root, config);
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
    const target = relPath(root, page.file);
    const acknowledged = exceptionFor(exceptions, target);
    const slug = page.data.researchSlug;
    if (typeof slug !== 'string' || !slug) {
      add('error', 'orphan', `${target}: learning.researchSlug is missing`);
      continue;
    }
    publishedSlugs.add(slug);
    if (!researchSlugs.has(slug) && !acknowledged) {
      add(
        'error',
        'orphan',
        `${target}: orphan learning page for research topic "${slug}", which has no docs/${slug}/README.md`,
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
      const target = relPath(root, file);
      const acknowledged = exceptionFor(exceptions, target);
      if (!researchSlugs.has(slug) && !acknowledged) {
        add('error', 'orphan', `${target}: orphan coverage map for research topic "${slug}", which does not exist`);
      }
    }
  }

  // 4. Acknowledged exceptions, reported so they cannot rot unnoticed.
  for (const entry of exceptions.entries) {
    for (const target of entry.targets || []) {
      const resolved = resolve(root, target);
      const stillPresent = existsSync(resolved);
      const today = new Date().toISOString().slice(0, 10);
      if (!stillPresent) {
        add('warning', 'exception', `acknowledged exception "${entry.id}" targets ${target}, which no longer exists; remove the entry`);
      } else if (entry.reviewBy && today > entry.reviewBy) {
        add('warning', 'exception', `acknowledged exception "${entry.id}" passed its reviewBy date ${entry.reviewBy}; resolve or renew it`);
      } else {
        add('info', 'exception', `acknowledged exception "${entry.id}" covers ${target} until ${entry.reviewBy || 'further notice'}: ${entry.reason}`);
      }
    }
  }

  // 5. Config keys with no consumer. Archived history is excluded so a preserved
  // pre-consolidation snapshot cannot mask a key nothing reads today.
  for (const key of unconsumedConfigKeys(root, config)) {
    add('warning', 'config', `.agents/config.json key "${key}" has no consumer in .agents/, scripts/, or src/ (history excluded)`);
  }

  // 6. Feature list coherence, when one exists.
  const featurePath = harnessPath(root, config, 'featureListPath', '.agents/features.json');
  if (existsSync(featurePath)) {
    const features = readJson(featurePath);
    const list = Array.isArray(features.features) ? features.features : [];
    const validStates = new Set(['not-started', 'in-progress', 'blocked', 'done']);
    for (const feature of list) {
      if (!feature.id || !feature.behavior) {
        add('error', 'feature', `${relPath(root, featurePath)}: feature "${feature.id || '(no id)'}" needs id and behavior`);
      }
      if (!feature.verify) {
        add('error', 'feature', `${relPath(root, featurePath)}: feature "${feature.id}" has no verification command`);
      }
      if (!validStates.has(feature.state)) {
        add('error', 'feature', `${relPath(root, featurePath)}: feature "${feature.id}" state "${feature.state}" is invalid; expected ${[...validStates].join(', ')}`);
      }
      if (feature.state === 'done' && !feature.evidence) {
        add('error', 'feature', `${relPath(root, featurePath)}: feature "${feature.id}" is done but records no evidence; only verification may set done`);
      }
    }
    const inProgress = list.filter((feature) => feature.state === 'in-progress');
    if (inProgress.length > 1) {
      add('warning', 'feature', `${inProgress.length} features are in-progress (${inProgress.map((f) => f.id).join(', ')}); WIP=1 is the safe default`);
    }
  }

  // 7. Learning design files, so a new topic cannot ship unplanned.
  for (const slug of researchSlugs) {
    const design = resolve(docsDir, slug, config.requiredLearningDesignFile || 'learning.md');
    if (!existsSync(design)) {
      add('warning', 'planning', `${relPath(root, design)} is missing; run \`node .agents/bin/deep-learn.mjs new\` or author the page plan before publishing`);
    }
  }

  // 8. Progress file freshness, so a new session is not read-only by default.
  const progressPath = harnessPath(root, config, 'progressFile', '.agents/PROGRESS.md');
  if (!existsSync(progressPath)) {
    add('warning', 'progress', `${relPath(root, progressPath)} is missing; every session currently re-derives state from scratch`);
  } else {
    const progress = readFileSync(progressPath, 'utf8');
    for (const block of ['## Current state', '## In flight', '## Next session starts', '## Last green baseline']) {
      if (!progress.includes(block)) add('warning', 'progress', `${relPath(root, progressPath)} is missing the "${block.replace('## ', '')}" block`);
    }
    const stamp = progress.match(/updated\s+(\d{4}-\d{2}-\d{2})/i);
    if (stamp) {
      const days = Math.floor((Date.now() - Date.parse(`${stamp[1]}T00:00:00Z`)) / 86_400_000);
      if (Number.isFinite(days) && days > 30) {
        add('warning', 'progress', `${relPath(root, progressPath)} was last updated ${days} days ago; it is no longer a reliable resume pointer`);
      }
    }
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

\`new\` also writes the topic's learning design file, which holds the objectives,
concepts, page plan, and assessments the visual stage plans against.

\`doctor\` and \`sync --check\` are read-only and never repair state.

The internal --root <path> option supports isolated harness tests.`);
}

const args = process.argv.slice(2);
const root = resolve(takeOption(args, '--root') || SCRIPT_ROOT);
const configPath = join(root, '.agents/config.json');
if (!existsSync(configPath)) fail(`DeepLearn config not found: ${configPath}`);
let config;
try {
  config = loadConfig(root);
} catch (error) {
  fail(error.message);
}
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
