import { defineConfig } from 'vitest/config'

export default defineConfig({
	base: '/',
	resolve: {
		alias: [
			{ find: '@src', replacement: '/src' },
			{ find: /^@prisma\/client$/, replacement: '/prisma/client/client.ts' },
		],
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: 'src/setupTests.ts',
		deps: { interopDefault: false },
		env: {
			environment: 'development',
			jwt_secret: 'test-secret',
			s3_endpoint: 'http://localhost:9000',
			s3_bucket_id: 'test-bucket',
			s3_access_key_id: 'test-access-key',
			s3_access_key_secret: 'test-access-secret',
		},
		testTimeout: 15000,
		exclude: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
	},
})
