import { getPermalink } from './utils/permalinks'

export const headerData = {
	links: [
		{
			text: 'Documentation',
			href: getPermalink('/docs'),
		},
		{
			text: 'Downloads',
			href: getPermalink('/download'),
		},
		{
			text: 'Contact',
			href: getPermalink('/contact'),
		},
		{
			text: 'Discord',
			href: 'https://discord.gg/rD3KdXmqDP',
			icon: 'tabler:brand-discord',
		},
	],
	actions: [
		{ text: 'Login', href: 'https://app.neverkin.com' },
		{ text: 'Create Account', href: 'https://app.neverkin.com/create-account' },
	],
}

export const footerData = {
	links: [
		// {
		// 	title: 'Product',
		// 	links: [
		// 		{ text: 'Features', href: getPermalink('/#features') },
		// 		{ text: 'Showcase', href: getPermalink('/#showcase') },
		// 		{ text: 'How It Works', href: getPermalink('/#how-it-works') },
		// 		{ text: 'FAQ', href: getPermalink('/#faq') },
		// 	],
		// },
		{
			title: 'Resources',
			links: [
				{ text: 'Comparison', href: getPermalink('/alternatives') },
				{ text: 'GitHub', href: 'https://github.com/tenebrie/neverkin' },
				{ text: 'Status', href: 'https://status.neverkin.com' },
				// { text: 'Changelog', href: '#' },
				// { text: 'Roadmap', href: '#' },
			],
		},
		{
			title: 'Community',
			links: [
				{ text: 'Discord', href: 'https://discord.gg/rD3KdXmqDP' },
				// { text: 'Reddit', href: '#' },
				{ text: 'Contribute', href: 'https://github.com/tenebrie/neverkin' },
				{ text: 'Contact Form', href: getPermalink('/contact') },
			],
		},
		// {
		// 	title: 'Legal',
		// 	links: [
		// 		{ text: 'Privacy Policy', href: getPermalink('/privacy') },
		// 		{ text: 'Terms of Use', href: getPermalink('/terms') },
		// 	],
		// },
	],
	secondaryLinks: [
		{ text: 'Terms', href: getPermalink('/terms') },
		{ text: 'Privacy Policy', href: getPermalink('/privacy') },
	],
	socialLinks: [
		{ ariaLabel: 'GitHub', icon: 'tabler:brand-github', href: 'https://github.com/tenebrie/neverkin' },
		{ ariaLabel: 'Discord', icon: 'tabler:brand-discord', href: 'https://discord.gg/rD3KdXmqDP' },
	],
	footNote: `
    <span class="text-muted">© 2022-2026 Neverkin. Open source under <a class="text-primary hover:underline" href="https://github.com/tenebrie/neverkin">GPL-3.0</a>.</span>
  `,
}
