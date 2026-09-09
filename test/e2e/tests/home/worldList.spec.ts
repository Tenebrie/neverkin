import { createNewUser, deleteAccount } from '@fixtures/auth'
import { expect, test } from '@playwright/test'

import { makeUrl } from '../utils'

test.describe('World List View', () => {
	test.beforeEach(async ({ page }) => {
		await createNewUser(page)
	})

	test('create world -> delete world flow', async ({ page }) => {
		await page.goto(makeUrl('/world'))

		// Create world
		await page.getByLabel('Create new world').click()

		await page.getByLabel('Name').fill('My First World')
		await page.getByLabel('Description').fill('World description')
		await page.getByText('Create', { exact: true }).click()

		await expect(page.getByLabel('Load world "My First World"')).toBeVisible()
		await expect(page.getByText('My First World')).toBeVisible()
		await expect(page.getByText('World description')).toBeVisible()

		await page.getByLabel('Load world "My First World"').click()

		await page.waitForURL(/\/world\/[a-f0-9-]+\/wiki/)
		await expect(page.getByText('My First World', { exact: true })).toBeVisible()

		// Navigate to settings
		await page.goto(makeUrl('/world'))
		await page.getByLabel('Edit world "My First World" button').click()
		await page.waitForURL(/\/world\/[a-f0-9-]+\/settings/)
		await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

		// Delete world
		await page.goto(makeUrl('/world'))
		await page.getByLabel('Delete world "My First World" button').click()
		await expect(page.getByText('Delete world', { exact: true })).toBeVisible()

		await page.getByText('Confirm').click()
		await expect(page.getByText('No worlds yet. Click the + button to create one!')).toBeVisible()
	})

	test('create worlds with different calendars', async ({ page }) => {
		await page.goto(makeUrl('/world'))

		async function createAndOpenWorld(worldName: string, calendarId: string) {
			await page.getByLabel('Create new world').click()
			await page.getByLabel('Name').fill(worldName)
			await page.getByLabel('Create new world popover').getByLabel('Calendar').click()
			await page.getByRole('option', { name: calendarId }).click()
			await page.getByText('Create', { exact: true }).click()

			await page.getByLabel(`Load world "${worldName}"`).click()
			await page.waitForURL(/\/world\/[a-f0-9-]+\/wiki/)
			await page.getByTestId('NavigateToTimeline').click()
		}

		await createAndOpenWorld('Earth World', 'Gregorian Calendar (Earth)')
		await expect(page.getByText('January 01, 2026', { exact: true })).toBeVisible()
		await page.goto(makeUrl('/world'))

		await createAndOpenWorld('Martian World', 'Darian Calendar (Martian)')
		await expect(page.getByText('01 Sagittarius 0000', { exact: true })).toBeVisible()
		await page.goto(makeUrl('/world'))

		await createAndOpenWorld('Golarion World', 'Golarion Calendar (Pathfinder)')
		await expect(page.getByText('01 Abadius, 4726', { exact: true })).toBeVisible()
		await page.goto(makeUrl('/world'))

		await createAndOpenWorld('Quadrum World', 'Quadrum Calendar (RimWorld)')
		await expect(page.getByText('Aprimay 01, 5500', { exact: true })).toBeVisible()
		await page.goto(makeUrl('/world'))

		await createAndOpenWorld('Exether World', 'Exether Calendar')
		await expect(page.getByText('Frostmoot 01, 1178', { exact: true })).toBeVisible()
		await page.goto(makeUrl('/world'))
	})

	test('create world with user template calendar', async ({ page }) => {
		await page.goto(makeUrl('/calendar'))

		// Create a new calendar
		await page.getByLabel('Create new calendar').click()
		await page.getByLabel('Name').fill('Custom Calendar')
		await page.getByLabel('Template to copy').click()
		await page.getByRole('option', { name: 'Gregorian Calendar (Earth)' }).click()
		await page.getByText('Create', { exact: true }).click()

		// Navigate to the new calendar
		await page.getByLabel(`Load calendar "Custom Calendar"`).click()
		await page.waitForURL(/\/calendar\/[a-f0-9-]+/)

		// Scramble the origin time
		await page.getByLabel('Origin timestamp input').fill('1776777056')
		await expect(page.getByLabel('Origin timestamp preview')).toHaveText('22:56 March 25, 3379')
		const requestPromise = page.waitForRequest(
			(req) => req.url().includes('/calendar/') && req.method() === 'PATCH',
		)
		await page.getByText('Save', { exact: true }).click()
		await requestPromise

		// Create a world with the new calendar
		await page.goto(makeUrl('/world'))

		await page.getByLabel('Create new world').click()
		await page.getByLabel('Name').fill('Custom Calendar World')
		await page.getByLabel('Create new world popover').getByLabel('Calendar').click()
		await page.getByRole('option', { name: 'Custom Calendar' }).click()
		await page.getByText('Create', { exact: true }).click()

		// Navigate to the new world
		await page.getByLabel(`Load world "Custom Calendar World"`).click()
		await page.waitForURL(/\/world\/[a-f0-9-]+\/wiki/)
		await page.getByTestId('NavigateToTimeline').click()

		// Check anchor line is rendered
		await expect(page.getByText('March 26, 3379', { exact: true })).toBeVisible()
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})
