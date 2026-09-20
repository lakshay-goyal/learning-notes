// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import mermaid from 'astro-mermaid-satteri';
import astroD2 from 'astro-d2';
import starlight from '@astrojs/starlight';
import starlightSidebarTopics from 'starlight-sidebar-topics';
import starlightImageZoom from 'starlight-image-zoom';
import starlightSiteGraph from 'starlight-site-graph';
import starlightVideos from 'starlight-videos';
import starlightViewModes from 'starlight-view-modes';
import starlightTagsPlugin from 'starlight-tags';
import starlightHeadingBadges from 'starlight-heading-badges';
import starlightQuiz from 'starlight-quiz';
import starlightLinksValidator from 'starlight-links-validator';
import starlightLlmsTxt from 'starlight-llms-txt';
import starlightMdTxt from 'starlight-md-txt';
import starlightCodeblockFullscreen from 'starlight-codeblock-fullscreen';
import starlightFullviewMode from 'starlight-fullview-mode';

// https://astro.build/config
export default defineConfig({
	site: 'http://localhost:4321',
	markdown: {
		processor: satteri(),
	},
	integrations: [
		mermaid({ theme: 'forest', autoTheme: true }),
		astroD2({ experimental: { useD2js: true } }),
		starlight({
			title: 'My Learning Hub',
			description: 'All my learnings in one place — software, AI, mobile, system design, DevOps, UI, soft skills & tools.',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
			components: {
				// Hide the built-in topics list — homepage is the only switcher.
				// Per-topic sidebar filtering from the plugin still applies.
				Sidebar: './src/components/Sidebar.astro',
			},
			plugins: [
				starlightSidebarTopics(
					[
						{
							label: 'Software Development',
							link: '/software-development/',
							icon: 'code',
							items: [{ autogenerate: { directory: 'software-development' } }],
						},
						{
							label: 'AI Engineering',
							link: '/ai-engineering/',
							icon: 'rocket',
							items: [{ autogenerate: { directory: 'ai-engineering' } }],
						},
						{
							label: 'Mobile Development',
							link: '/mobile-development/',
							icon: 'mobile-android',
							items: [{ autogenerate: { directory: 'mobile-development' } }],
						},
						{
							label: 'System Design',
							link: '/system-design/',
							icon: 'server',
							items: [{ autogenerate: { directory: 'system-design' } }],
						},
						{
							label: 'DevOps',
							link: '/devops/',
							icon: 'cloud-download',
							items: [{ autogenerate: { directory: 'devops' } }],
						},
						{
							label: 'UI Design',
							link: '/ui-design/',
							icon: 'pencil',
							items: [{ autogenerate: { directory: 'ui-design' } }],
						},
						{
							label: 'Soft Skills',
							link: '/soft-skills/',
							icon: 'comment',
							items: [{ autogenerate: { directory: 'soft-skills' } }],
						},
						{
							label: 'Tools',
							link: '/tools/',
							icon: 'setting',
							items: [{ autogenerate: { directory: 'tools' } }],
						},
					],
					{ exclude: ['/', '/tags', '/tags/**/*', '/zen-mode', '/zen-mode/**/*'] },
				),
				starlightImageZoom(),
				starlightSiteGraph(),
				starlightVideos(),
				starlightViewModes(),
				starlightTagsPlugin(),
				starlightHeadingBadges(),
				starlightQuiz(),
				starlightLinksValidator(),
				starlightLlmsTxt(),
				starlightMdTxt(),
				starlightCodeblockFullscreen(),
				starlightFullviewMode(),
			],
		}),
	],
});
