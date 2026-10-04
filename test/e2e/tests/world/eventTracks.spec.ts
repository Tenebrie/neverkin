import { createNewUser, deleteAccount } from '@fixtures/auth'
import { navigateToTimeline } from '@fixtures/world'
import test, { expect, Locator, Page, Request } from '@playwright/test'

const TRACK_PATCH_REGEX = /\/api\/world\/[a-zA-Z0-9-]+\/event-track\/[a-zA-Z0-9-]+$/
const TRACK_MOVE_REGEX = /\/api\/world\/[a-zA-Z0-9-]+\/event-track\/move$/

test.describe('Event Tracks', () => {
	test.beforeEach(async ({ page }) => {
		await createNewUser(page)
	})

	test('create and delete a track', async ({ page }) => {
		await navigateToTimeline(page, 'createWorld')
		await openEventTracksModal(page)

		await createTrack(page, 'Main Plot')

		const row = trackRow(page, 'Main Plot')
		await expect(row).toBeVisible()

		await closeEventTracksModal(page)

		await expect(page.getByRole('button', { name: 'Main Plot', exact: true })).toBeVisible()

		await openEventTracksModal(page)
		await row.getByRole('button', { name: 'Delete track' }).click()
		const confirmDelete = page.getByRole('button', { name: 'Delete', exact: true })
		await expect(confirmDelete).toBeVisible()
		await confirmDelete.click()

		await expect(trackRow(page, 'Main Plot')).toHaveCount(0)

		await closeEventTracksModal(page)

		await expect(page.getByRole('button', { name: 'Main Plot', exact: true })).toBeHidden()
	})

	test('tracks can be reordered by dragging', async ({ page }) => {
		await navigateToTimeline(page, 'createWorld')
		await openEventTracksModal(page)

		await createTrack(page, 'Track A')
		await createTrack(page, 'Track B')

		const bodyRows = page.getByTestId('ModalBackdrop').locator('tbody tr')
		await expect(bodyRows).toHaveCount(3)
		await expect(bodyRows.nth(0)).toContainText('Track B')
		await expect(bodyRows.nth(1)).toContainText('Track A')
		await expect(bodyRows.nth(2)).toContainText('Unassigned')

		const moveResponse = page.waitForResponse(
			(res) => res.request().method() === 'POST' && TRACK_MOVE_REGEX.test(res.url()) && res.status() === 204,
		)
		await dragTrackOnto(page, trackRow(page, 'Track A'), trackRow(page, 'Track B'))
		await moveResponse

		await expect(bodyRows.nth(0)).toContainText('Track A')
		await expect(bodyRows.nth(1)).toContainText('Track B')
		await expect(bodyRows.nth(2)).toContainText('Unassigned')

		await closeEventTracksModal(page)

		const titles = page.getByLabel('Timeline tracks container').getByRole('button')
		await expect(titles.nth(0)).toHaveText('Track A')
		await expect(titles.nth(1)).toHaveText('Track B')
		await expect(titles.nth(2)).toHaveText('Manage event tracks...')

		await page.reload()
		const reloadedTitles = page.getByLabel('Timeline tracks container').getByRole('button')
		await expect(reloadedTitles.nth(0)).toHaveText('Track A')
		await expect(reloadedTitles.nth(1)).toHaveText('Track B')
		await expect(reloadedTitles.nth(2)).toHaveText('Manage event tracks...')
	})

	test('navigation buttons scroll to the earliest and latest event on the track', async ({ page }) => {
		await navigateToTimeline(page, 'createWorld')

		const earliestMarker = page.locator('[data-testid="TimelineMarker"][data-entity-name="Earliest event"]')
		const latestMarker = page.locator('[data-testid="TimelineMarker"][data-entity-name="Latest event"]')

		await createEventAsUser(page, 'Earliest event')

		await timeTravel(page, '3d')
		await expect(earliestMarker).toHaveCount(0)

		await createEventAsUser(page, 'Latest event')
		await expect(latestMarker).toBeVisible()
		await expect(earliestMarker).toHaveCount(0)

		const container = page.getByLabel('Timeline tracks container')
		const containerBox = await container.boundingBox()
		expect(containerBox).toBeTruthy()
		const centerX = containerBox!.x + containerBox!.width / 2

		await openEventTracksModal(page)
		await trackRow(page, 'Unassigned').getByTitle('Scroll to the earliest event').click()
		await closeEventTracksModal(page)

		await expect(earliestMarker).toBeVisible()
		await expect(latestMarker).toHaveCount(0)
		await expect
			.poll(
				async () => {
					const box = await earliestMarker.boundingBox()
					return box ? Math.abs(box.x + box.width / 2 - centerX) : Infinity
				},
				{ timeout: 5000 },
			)
			.toBeLessThan(30)

		await openEventTracksModal(page)
		await trackRow(page, 'Unassigned').getByTitle('Scroll to the latest event').click()
		await closeEventTracksModal(page)

		await expect(latestMarker).toBeVisible()
		await expect(earliestMarker).toHaveCount(0)
		await expect
			.poll(
				async () => {
					const box = await latestMarker.boundingBox()
					return box ? Math.abs(box.x + box.width / 2 - centerX) : Infinity
				},
				{ timeout: 5000 },
			)
			.toBeLessThan(30)
	})

	test('renaming a track sends a single update request on blur', async ({ page }) => {
		await navigateToTimeline(page, 'createWorld')
		await openEventTracksModal(page)
		await createTrack(page, 'Original')

		// Anchor by table position — name-based row filters break once edit mode swaps in an
		// <Input> (Playwright `hasText` walks textContent, not input values).
		const row = page.getByTestId('ModalBackdrop').locator('tbody tr').first()

		let updateCount = 0
		const listener = (req: Request) => {
			if (req.method() === 'PATCH' && TRACK_PATCH_REGEX.test(req.url())) {
				updateCount++
			}
		}
		page.on('request', listener)

		await row.getByRole('button', { name: /Original/ }).click()

		const input = page.getByTestId('ModalBackdrop').getByPlaceholder('Label (e.g. January)')
		await expect(input).toBeVisible()
		await input.click()

		await input.fill('')
		await input.pressSequentially('Renamed Track', { delay: 20 })
		await expect(input).toHaveValue('Renamed Track')
		expect(updateCount).toBe(0)

		const patchRequest = page.waitForRequest(
			(req) => req.method() === 'PATCH' && TRACK_PATCH_REGEX.test(req.url()),
		)
		await page.keyboard.press('Tab')
		await patchRequest

		// Negative assertion: prove no duplicate PATCH fires within 500ms.
		await page.waitForTimeout(500)

		expect(updateCount).toBe(1)
		await expect(row).toContainText('Renamed Track')

		page.off('request', listener)
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})

function eventTracksModalOpenSignal(page: Page): Locator {
	return page.getByRole('button', { name: 'Create new track', exact: true })
}

async function openEventTracksModal(page: Page) {
	await page.getByRole('button', { name: 'Manage event tracks...' }).click()
	await expect(eventTracksModalOpenSignal(page)).toBeVisible()
}

async function closeEventTracksModal(page: Page) {
	await page.keyboard.press('Escape')
	await expect(eventTracksModalOpenSignal(page)).toBeHidden()
}

async function createTrack(page: Page, name: string) {
	const rows = page.getByTestId('ModalBackdrop').locator('tbody tr')
	const before = await rows.count()
	await eventTracksModalOpenSignal(page).click()
	const input = page.getByRole('textbox', { name: 'Name' })
	await expect(input).toBeVisible()
	await input.fill(name)
	await page.keyboard.press('Enter')
	await expect(rows).toHaveCount(before + 1)
}

// textContent-based filter — input values don't match, so don't use on rows whose name mutates.
function trackRow(page: Page, trackName: string): Locator {
	return page.getByTestId('ModalBackdrop').locator('tbody tr').filter({ hasText: trackName })
}

async function dragTrackOnto(page: Page, source: Locator, target: Locator) {
	const sourceHandle = source.locator('[data-testid="TrackDragHandle"]')
	const sourceBox = await sourceHandle.boundingBox()
	const targetBox = await target.boundingBox()
	expect(sourceBox).toBeTruthy()
	expect(targetBox).toBeTruthy()

	const startX = sourceBox!.x + sourceBox!.width / 2
	const startY = sourceBox!.y + sourceBox!.height / 2
	const endX = targetBox!.x + targetBox!.width / 2
	const endY = targetBox!.y + targetBox!.height / 2

	await page.mouse.move(startX, startY)
	await page.mouse.down()
	// Cross the 3px drag-start threshold in useDragDrop.
	await page.mouse.move(startX + 8, startY, { steps: 3 })
	await page.mouse.move(endX, endY, { steps: 20 })
	await page.mouse.up()
}

async function createEventAsUser(page: Page, name: string) {
	await page.getByTestId('CreateEntityButton').click()
	const textbox = page.getByTestId('RichTextEditor').getByRole('textbox')
	await expect(textbox).toBeVisible()
	// Tiptap autoFocus races early keystrokes — focus explicitly.
	await textbox.click()
	await textbox.pressSequentially(name, { delay: 50 })
	await expect(textbox).toHaveText(name)
	await page.getByTestId('CreateEventModalConfirmButton').click()
	await expect(page.locator(`[data-testid="TimelineMarker"][data-entity-name="${name}"]`)).toBeVisible()
}

async function timeTravel(page: Page, selector: string) {
	// Single-key shortcuts are no-ops when an input / contentEditable holds focus.
	await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
	await page.keyboard.press('t')
	const input = page.getByRole('textbox', { name: 'Selector' })
	await expect(input).toBeVisible()
	await input.click()
	await input.fill(selector)
	await page.keyboard.press('Enter')
	await expect(input).toBeHidden()
}
