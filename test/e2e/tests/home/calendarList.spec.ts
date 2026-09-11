import { createNewUser, deleteAccount } from '@fixtures/auth'
import test, { expect } from '@playwright/test'
import { makeUrl } from '@tests/utils'

test.describe('Calendar List View', () => {
	test.beforeEach(async ({ page }) => {
		await createNewUser(page)
	})

	test('create calendar -> delete calendar flow', async ({ page }) => {
		await page.goto(makeUrl('/calendar'))

		// Create calendar
		await page.getByLabel('Create new calendar').click()
		await page.getByLabel('Name').fill('My Test Calendar')
		await page.getByLabel('Template to copy').click()
		await page.getByRole('option', { name: 'Gregorian Calendar (Earth)' }).click()
		await page.getByText('Create', { exact: true }).click()

		await expect(page.getByLabel('Load calendar "My Test Calendar"')).toBeVisible()
		await expect(page.getByRole('button', { name: 'Load calendar "My Test Calendar' })).toBeVisible()

		// Delete calendar
		await page.getByLabel('Delete calendar').click()
		await expect(page.getByText('Are you sure you want to delete calendar')).toBeVisible()
		await page.getByRole('button', { name: 'Delete' }).click()

		await expect(page.getByText('No calendars yet. Click the + button to create one!')).toBeVisible()
	})

	test('create calendars from different templates', async ({ page }) => {
		await page.goto(makeUrl('/calendar'))

		async function createAndOpenCalendar(calendarName: string, templateName: string) {
			await page.getByLabel('Create new calendar').click()
			await page.getByLabel('Name').fill(calendarName)
			await page.getByLabel('Template to copy').click()
			await page.getByRole('option', { name: templateName }).click()
			await page.getByText('Create', { exact: true }).click()

			await page.getByLabel(`Load calendar "${calendarName}"`).click()
			await page.waitForURL(/\/calendar\/[a-f0-9-]+/)
			await expect(page.getByText('Your Calendars')).not.toBeVisible()
		}

		await createAndOpenCalendar('Earth Calendar', 'Gregorian Calendar (Earth)')
		await expect(page.getByText('Earth Calendar')).toBeVisible()
		await expect(page.getByText('00:00 January 01, 2026').first()).toBeVisible()
		await page.goto(makeUrl('/calendar'))

		await createAndOpenCalendar('Martian Calendar', 'Darian Calendar (Martian)')
		await expect(page.getByText('Martian Calendar')).toBeVisible()
		await expect(page.getByText('00:00 01 Sagittarius 0000').first()).toBeVisible()
		await page.goto(makeUrl('/calendar'))

		await createAndOpenCalendar('Golarion Calendar', 'Golarion Calendar (Pathfinder)')
		await expect(page.getByText('Golarion Calendar')).toBeVisible()
		await expect(page.getByText('00:00 Abadius 01, 4726').first()).toBeVisible()
		await page.goto(makeUrl('/calendar'))

		await createAndOpenCalendar('Quadrum Calendar', 'Quadrum Calendar (RimWorld)')
		await expect(page.getByText('Quadrum Calendar')).toBeVisible()
		await expect(page.getByText('00:00 Aprimay 01, 5500').first()).toBeVisible()
		await page.goto(makeUrl('/calendar'))

		await createAndOpenCalendar('Exether Calendar', 'Exether Calendar')
		await expect(page.getByText('Exether Calendar')).toBeVisible()
		await expect(page.getByText('00:00 Frostmoot 01, 1178').first()).toBeVisible()
		await page.goto(makeUrl('/calendar'))
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})
