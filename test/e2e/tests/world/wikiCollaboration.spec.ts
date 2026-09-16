import { createNewUser, deleteAccount, loginAsUser } from '@fixtures/auth'
import { navigateToWiki, wikiListEntity } from '@fixtures/world'
import { expect, test } from '@playwright/test'

test.describe('Wiki Collaboration', () => {
	test('parallel editing', async ({ browser, page }) => {
		// Create another independent page
		const secondaryPage = await browser.newPage()

		// Setup base page
		const user = await createNewUser(page)
		const { world } = await navigateToWiki(page, 'createWorld')

		// Setup secondary page
		await loginAsUser(secondaryPage, user)
		await navigateToWiki(secondaryPage, world)
		await secondaryPage.waitForTimeout(1000)

		// Create article
		await page.getByRole('button', { name: 'Create new object' }).click()
		await page.getByRole('button', { name: 'Article', exact: true }).click()
		await page.getByPlaceholder('Name').fill('Testing article')
		await page.getByRole('button', { name: 'Create', exact: true }).click()
		await expect(page.getByTestId('ArticleListItem/Testing article/0')).toBeVisible()

		// Open article on both pages
		await wikiListEntity(page, 'Testing article').click()
		await expect(page.getByTestId('EditableTitle').getByText('Testing article')).toBeVisible()

		await wikiListEntity(secondaryPage, 'Testing article').click()

		const baseTextbox = page.getByTestId('RichTextEditor').getByRole('textbox')
		const secondaryTextbox = secondaryPage.getByTestId('RichTextEditor').getByRole('textbox')
		await expect(baseTextbox).toBeVisible()
		await expect(secondaryTextbox).toBeVisible()

		// Edit article in base tab
		await baseTextbox.fill('Written by first tab')

		// Await changes and edit in secondary tab
		await expect(secondaryTextbox).toHaveText('Written by first tab')
		await secondaryTextbox.fill('Written by second tab')

		// Await changes in first tab
		await expect(baseTextbox).toHaveText('Written by second tab')
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})
