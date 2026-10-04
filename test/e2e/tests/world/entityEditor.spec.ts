import { createNewUser, deleteAccount } from '@fixtures/auth'
import {
	closeModal,
	createActor,
	createArticle,
	createEvent,
	createWorld,
	navigateToTimeline,
} from '@fixtures/world'
import test, { expect } from '@playwright/test'
import { makeUrl } from '@tests/utils'

test.describe('Entity Editor', () => {
	test.beforeEach(async ({ page }) => {
		await createNewUser(page)
	})

	test('should render backlinks tab for all entity types', async ({ page }) => {
		const world = await createWorld(page)
		await navigateToTimeline(page, world)

		await createActor(page, 'First actor')
		await createArticle(page, 'First article')

		await createEvent(page, 'First event')
		await createEvent(page, 'Second event')
		await createEvent(page, 'Third event')

		await page.locator('[data-testid="TimelineMarker"][data-entity-name="First event"]').dblclick()
		const contentEditor = page.getByTestId('ModalBackdrop').getByRole('textbox')
		// The collaborative editor renders a read-only preview until the Yjs document has synced
		await expect(contentEditor).toBeEditable()
		await contentEditor.fill('This will mention @Second event')
		await expect(page.getByRole('menuitem').filter({ hasText: 'Second event' }).first()).toHaveClass(
			/Mui-selected/,
		)
		await page.keyboard.press('Enter')

		await closeModal(page)

		// Calliope saves the mention to Rhea on a debounce, so wait until Rhea reports the backlink
		const worldResponse = await page.request.get(makeUrl(`/api/world/${world.id}`))
		const { events } = (await worldResponse.json()) as { events: { id: string; name: string }[] }
		const secondEventId = events.find((event) => event.name === 'Second event')?.id
		await expect
			.poll(
				async () => {
					const response = await page.request.get(
						makeUrl(`/api/world/${world.id}/event/${secondEventId}/backlinks`),
					)
					return ((await response.json()) as { name: string }[]).map((backlink) => backlink.name)
				},
				{ timeout: 10000 },
			)
			.toEqual(['First event'])

		await page.locator('[data-testid="TimelineMarker"][data-entity-name="Second event"]').dblclick()
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
