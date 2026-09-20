// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightSidebarTopics from 'starlight-sidebar-topics';

// https://astro.build/config
export default defineConfig({
	integrations: [
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
					{ exclude: ['/'] },
				),
			],
		}),
	],
});
