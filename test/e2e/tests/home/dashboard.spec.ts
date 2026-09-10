import { createNewUser, deleteAccount } from '@fixtures/auth'
import { navigateToDashboard } from '@fixtures/world'
import test, { expect } from '@playwright/test'

test.describe('Dashboard View', () => {
	test.beforeEach(async ({ page }) => {
		await createNewUser(page)
	})

	test('shows onboarding state for a new account', async ({ page }) => {
		await navigateToDashboard(page)

		await expect(page.getByText('No worlds yet', { exact: true })).toBeVisible()
		await expect(page.getByText('Start a world of your own')).toBeVisible()
		await expect(page.getByText('Define your own time')).toBeVisible()
		await expect(page.getByText('No recent activity yet.')).toBeVisible()

		// Nothing is shared with a brand new account, so that section stays hidden entirely
		await expect(page.getByRole('heading', { name: 'Shared with you' })).not.toBeVisible()
	})

	test('create world -> open it -> return home', async ({ page }) => {
		await navigateToDashboard(page)

		await page.getByLabel('Get started').click()
		await page.getByLabel('Name').fill('Dashboard World')
		await page.getByLabel('Description').fill('World description')
		await page.getByText('Create', { exact: true }).click()

		await expect(page.getByLabel('Load world "Dashboard World"')).toBeVisible()
		await expect(page.getByText('Start a world of your own')).not.toBeVisible()
		await expect(page.getByText('1 world of your own', { exact: true })).toBeVisible()
		await expect(page.getByText('World description')).toBeVisible()

		await page.getByLabel('Load world "Dashboard World"').click()
		await page.waitForURL(/\/world\/[a-f0-9-]+\/wiki/)

		await page.getByLabel('Home').click()
		await expect(page.getByLabel('Load world "Dashboard World"')).toBeVisible()

		// The world was opened, so it is now both the most recent activity and the last opened world
		await expect(page.getByText('World updated')).toBeVisible()
		await expect(page.getByText('Last opened')).toBeVisible()
	})

	test('create calendar from the dashboard', async ({ page }) => {
		await navigateToDashboard(page)

		await page.getByLabel('New calendar').click()
		await page.getByLabel('Name').fill('Dashboard Calendar')
		await page.getByLabel('Template to copy').click()
		await page.getByRole('option', { name: 'Gregorian Calendar (Earth)' }).click()
		await page.getByText('Create', { exact: true }).click()

		await expect(page.getByLabel('Load calendar "Dashboard Calendar"')).toBeVisible()
		await expect(page.getByText('Define your own time')).not.toBeVisible()
		await expect(page.getByText('No worlds yet · 1 calendar', { exact: true })).toBeVisible()
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})
