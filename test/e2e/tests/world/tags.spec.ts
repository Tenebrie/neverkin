import { createNewUser, deleteAccount } from '@fixtures/auth'
import { navigateToTimeline } from '@fixtures/world'
import test, { expect } from '@playwright/test'

test.describe('World Tags', () => {
	test.beforeEach(async ({ page }) => {
		await createNewUser(page)
	})

	test('quick create tag -> delete tag flow', async ({ page }) => {
		await navigateToTimeline(page, 'createWorld')

		// Open the create event menu
		await page.getByTestId('CreateEntityButton').click()
		await page.waitForTimeout(100)

		// Create event
		const textbox = page.getByTestId('RichTextEditor').getByRole('textbox')
		await textbox.focus()
		await textbox.pressSequentially('Hello', { delay: 10 })
		await page.waitForTimeout(500)
		await page.getByTestId('ModalBackdrop').getByText('Create', { exact: true }).click()
		await expect(page.getByTestId('ModalBackdrop')).toBeHidden()

		// Open event
		await page.getByTestId('TimelineMarker').click()
		await page.getByTestId('TimelineMarker').click()
		await expect(textbox).toHaveText('Hello')

		// Edit event: quick create a tag mention
		await textbox.click()
		await textbox.pressSequentially(' @New Tag', { delay: 10 })
		await page.keyboard.press('ArrowDown')
		await page.keyboard.press('ArrowDown')
		await page.keyboard.press('ArrowDown')
		await page.keyboard.press('Enter')
		await expect(textbox).toHaveText('Hello New Tag ')

		await expect(page.getByText('Tag with 1 mention')).toBeVisible()

		// Close event
		await page.keyboard.press('Escape')
		await expect(textbox).not.toBeVisible()

		// Delete event
		await page.getByTestId('TimelineMarker').click({ button: 'right' })
		await page.getByRole('menuitem', { name: 'Delete this event' }).click()
		await page.getByRole('button', { name: 'Confirm' }).click()

		await expect(page.getByTestId('TimelineMarker')).not.toBeVisible()

		await expect(page.getByText('New Tag')).toBeVisible()
		await expect(page.getByText('Tag with 0 mentions')).toBeVisible()

		// Delete tag
		await page.getByLabel('Show actions').click()
		await page.getByTestId('DeleteTagButton').click()
		await page.getByTestId('ModalBackdrop').getByText('Confirm').click()
		await expect(page.getByTestId('ModalBackdrop')).toBeHidden()

		await expect(page.getByText('New Tag')).not.toBeVisible()
		await expect(page.getByText('Tag with 0 mentions')).not.toBeVisible()
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})
