import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { starlightTagsExtension } from 'starlight-tags/schema';

const learningSchema = z.object({
	id: z.string(),
	category: z.string(),
	difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
	researchSlug: z.string(),
	updated: z.coerce.date(),
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
