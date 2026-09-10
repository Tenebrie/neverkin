import { createNewUser, deleteAccount } from '@fixtures/auth'
import { closeModal, createActor, createArticle, createEvent, navigateToTimeline } from '@fixtures/world'
import test, { expect } from '@playwright/test'

test.describe('Entity Editor', () => {
	test.beforeEach(async ({ page }) => {
		await createNewUser(page)
	})

	test.skip('should render backlinks tab for all entity types', async ({ page }) => {
		await navigateToTimeline(page, 'createWorld')

		await createActor(page, 'First actor')
		await createArticle(page, 'First article')

		await createEvent(page, 'First event')
		await createEvent(page, 'Second event')
		await createEvent(page, 'Third event')

		await page.locator('[data-testid="TimelineMarker"][data-entity-name="First event"]').click()
		await page.locator('[data-testid="TimelineMarker"][data-entity-name="First event"]').click()
		const contentEditor = page.getByTestId('ModalBackdrop').getByRole('textbox')
		// The collaborative editor renders a read-only preview until the Yjs document has synced
		await expect(contentEditor).toBeEditable()
		await contentEditor.fill('This will mention @Second event')
		await page.keyboard.press('Enter')

		await closeModal(page)

		await page.locator('[data-testid="TimelineMarker"][data-entity-name="Second event"]').click()
		await page.locator('[data-testid="TimelineMarker"][data-entity-name="Second event"]').click()
		await page.getByTestId('EntityEditorBacklinksTab').click()

		await expect(page.getByTestId('ModalBackdrop').getByRole('button', { name: 'First event' })).toBeVisible()
		await page.getByTestId('ModalBackdrop').getByRole('button', { name: 'First event' }).click()

		await page.getByTestId('EntityEditorContentTab').click()
		await expect(page.getByRole('heading', { name: 'First event' })).toBeVisible()

		await closeModal(page)

		await expect(page.getByRole('heading', { name: 'Second event' })).toBeVisible()
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})
