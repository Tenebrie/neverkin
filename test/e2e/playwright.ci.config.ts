import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: './tests',
	outputDir: './test-report/artifacts',
	reporter: [['list'], ['html', { outputFolder: './test-report/html', open: 'never' }]],
	retries: 2,
	fullyParallel: true,
	timeout: 30000,
	expect: {
		timeout: 10000,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
		},
	],
	use: {
		headless: true,
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure',
	},
})
