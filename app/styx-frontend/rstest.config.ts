import { defineConfig } from '@rstest/core'

import rsbuildConfig from './rsbuild.config'

export default defineConfig({
	plugins: rsbuildConfig.plugins,
	resolve: rsbuildConfig.resolve,
	source: {
		assetsInclude: rsbuildConfig.source?.assetsInclude,
	},
	globals: true,
	testEnvironment: 'jsdom',
	setupFiles: ['src/test-utils/setupTests.ts'],
	testTimeout: 15000,
	coverage: {
		provider: 'v8',
		reporters: ['text'],
	},
})
