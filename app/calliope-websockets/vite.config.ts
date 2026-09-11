import { defineConfig } from 'vitest/config'

export default defineConfig({
	base: '/',
	resolve: {
		alias: [{ find: '@src', replacement: '/src' }],
	},
	test: {
		environment: 'node',
		testTimeout: 15000,
		restoreMocks: true,
	},
})
