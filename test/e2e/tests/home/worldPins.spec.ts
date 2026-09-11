import { createNewUser, deleteAccount } from '@fixtures/auth'
import { createWorld, navigateToDashboard, shareWorldWith } from '@fixtures/world'
import { expect, Page, test } from '@playwright/test'

test.describe('World Pins', () => {
	let secondaryPage: Page

	test.beforeEach(async ({ browser }) => {
		secondaryPage = await browser.newPage()
	})

	test('two users pin the same world independently', async ({ page }) => {
		await createNewUser(page)
		await createNewUser(secondaryPage)

		const world = await createWorld(page)
		await shareWorldWith(page, world, secondaryPage)

		// `Pin world "..."` is a substring of `Unpin world "..."`, so both lookups have to be exact
		const pinButton = (target: Page) => target.getByLabel(`Pin world "${world.name}"`, { exact: true })
		const unpinButton = (target: Page) => target.getByLabel(`Unpin world "${world.name}"`, { exact: true })

		await navigateToDashboard(page)
		await navigateToDashboard(secondaryPage)

		// Both users start with the shared world unpinned
		await expect(pinButton(page)).toBeVisible()
		await expect(pinButton(secondaryPage)).toBeVisible()

		// The first user pins the world
		await pinButton(page).click()
		await expect(unpinButton(page)).toBeVisible()

		// The pin belongs to the first user only
		await secondaryPage.reload()
		await expect(pinButton(secondaryPage)).toBeVisible()

		// The second user pins the same world for themselves
		await pinButton(secondaryPage).click()
		await expect(unpinButton(secondaryPage)).toBeVisible()

		// The first user unpins, which must not touch the second user's pin
		await unpinButton(page).click()
		await expect(pinButton(page)).toBeVisible()

		// Both states survive a reload, so they came from the server rather than the optimistic update
		await page.reload()
		await secondaryPage.reload()
		await expect(pinButton(page)).toBeVisible()
		await expect(unpinButton(secondaryPage)).toBeVisible()
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
		await deleteAccount(secondaryPage)
		await secondaryPage.close()
	})
})
