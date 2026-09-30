import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { starlightTagsExtension } from 'starlight-tags/schema';
import { LEARNING_LEVELS, PAGE_KINDS, TAXONOMY_FACETS } from '../.agents/contracts/learning-contract.mjs';

/**
 * Page identity contract.
 *
 * `id` is the page's own stable identity (`pageId`). `topicId` is shared by every
 * page of one topic. A legacy page that declares only `id` resolves to
 * `topicId === pageId === id` and `kind: 'overview'`, so every page published
 * before this contract existed stays valid without edits and keeps its route.
 *
 * The enums are imported from the same module the harness validators use, so
 * there is exactly one definition of each vocabulary.
 */
const enumFrom = (values) => z.enum(values as [string, ...string[]]);

const taxonomySchema = Object.fromEntries(
	TAXONOMY_FACETS.map((facet) => [facet, z.array(z.string()).default([])]),
);

const learningSchema = z.object({
	/** Stable page identity. Unique across the learning site. */
	id: z.string(),
	/** Stable topic identity. Shared by every page of one topic. */
	topicId: z.string().optional(),
	/** Explicit page identity when a page needs to differ from `id`. */
	pageId: z.string().optional(),
	/** One overview per topic, plus any number of focused child pages. */
	kind: enumFrom(PAGE_KINDS).default('overview'),
	order: z.number().default(0),
	level: enumFrom(LEARNING_LEVELS).optional(),
	category: z.string(),
	difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
	researchSlug: z.string(),
	updated: z.coerce.date(),
	/** Observable objectives this page is responsible for teaching. */
	objectiveIds: z.array(z.string()).default([]),
	/** Assessments or labs that produce evidence for those objectives. */
	assessmentIds: z.array(z.string()).default([]),
	conceptIds: z.array(z.string()).default([]),
	labIds: z.array(z.string()).default([]),
	...taxonomySchema,
	prerequisites: z.array(z.string()).default([]),
	relations: z
		.array(
			z.object({
				id: z.string(),
				type: z.enum([
					'prerequisite',
					'related',
					'alternative',
					'implementation-of',
					'used-by',
					'depends-on',
					'contrasts-with',
					'applied-in',
					'belongs-to',
				]),
				label: z.string(),
				href: z.string(),
			}),
		)
		.default([]),
});

const researchSchema = z
	.object({
		title: z.string().optional(),
		slug: z.string().optional(),
		mode: z.string().optional(),
		status: z.string().optional(),
		created: z.coerce.date().optional(),
		updated: z.coerce.date().optional(),
		versions: z.string().optional(),
	})
	.passthrough();

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: starlightTagsExtension.extend({ learning: learningSchema.optional() }),
		}),
	}),
	research: defineCollection({
		loader: glob({ base: './docs', pattern: ['**/*.md', '!README.md'] }),
		schema: researchSchema,
	}),
};
