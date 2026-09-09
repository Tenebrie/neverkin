import { createNewUser, deleteAccount } from '@fixtures/auth'
import { navigateToTimeline } from '@fixtures/world'
import test, { expect } from '@playwright/test'
import { multiselectModifier } from '@tests/utils'

test.describe('Timeline View', () => {
	test.beforeEach(async ({ page }) => {
		await createNewUser(page)
	})

	test('create event -> edit event -> delete event flow', async ({ page }) => {
		await navigateToTimeline(page, 'createWorld')

		// Open the create event menu
		await page.getByTestId('CreateEntityButton').click()
		await page.waitForTimeout(100)

		// Create event
		const textbox = page.getByTestId('RichTextEditor').getByRole('textbox')
		await textbox.pressSequentially('Hello world', { delay: 100 })
		await page.getByTestId('CreateEventModalConfirmButton').click()
		await page.waitForTimeout(500)
		await expect(page.getByTestId('TimelineMarker')).toBeVisible()
		// TODO: Update assertions for the new design (use world state?)
		// await expect(page.getByTestId('TimelineMarker')).toHaveText('Hello world')

		// Open event
		await page.getByTestId('TimelineMarker').click()
		await page.getByTestId('TimelineMarker').click()
		await expect(textbox).toHaveText('Hello world')

		// Edit event
		await page.waitForTimeout(250)
		await textbox.click()
		await textbox.press('End')
		await textbox.pressSequentially(' - extra text', { delay: 100 })
		await expect(textbox).toHaveText('Hello world - extra text')
		await page.waitForTimeout(250)

		// Close event
		await page.keyboard.press('Escape')
		await expect(textbox).not.toBeVisible()

		// Reopen event (should have the updated text)
		await page.getByTestId('TimelineMarker').click()
		await page.getByTestId('TimelineMarker').click()
		await page.waitForTimeout(100)
		await expect(textbox).toHaveText('Hello world - extra text')

		// Click outside to close
		await page
			.getByTestId('ModalBackdrop')
			.filter({ has: textbox })
			.click({ position: { x: 0, y: 0 } })
		await expect(textbox).not.toBeVisible()

		// Delete event
		await page.getByTestId('TimelineMarker').click({ button: 'right' })
		await page.getByRole('menuitem', { name: 'Delete this event' }).click()
		await page.getByRole('button', { name: 'Confirm' }).click()

		await expect(page.getByTestId('TimelineMarker')).not.toBeVisible()
	})

	test('navigation', async ({ page }) => {
		await navigateToTimeline(page, 'createWorld')

		await expect(page.getByText('January 01, 2026', { exact: true })).toBeVisible()
		// await page.getByLabel('Timeline tracks container').click()

		await page.getByLabel('Zoom out timeline').click()
		await page.waitForTimeout(500)

		// Navigate right with shortcut
		for (let i = 0; i < 4; i++) {
			await page.keyboard.press('l')
			await page.waitForTimeout(50)
		}
		await expect(page.getByText('January 02, 2026', { exact: true })).toBeVisible()

		// Navigate left with shortcut
		for (let i = 0; i < 11; i++) {
			await page.keyboard.press('j')
			await page.waitForTimeout(50)
		}
		await expect(page.getByText('December 31, 2025', { exact: true })).toBeVisible()

		for (let i = 0; i < 10; i++) {
			await page.keyboard.press('j')
			await page.waitForTimeout(50)
		}

		await page.getByLabel('Zoom in timeline').click()
		await expect(async () => {
			await expect(page.getByText('21:00', { exact: true })).toBeVisible()
			await expect(page.getByText('22:00', { exact: true })).toBeVisible()
			await expect(page.getByText('21:25 December 26, 2025', { exact: true })).toBeVisible()
		}).toPass()
	})

	test('nudging events horizontally', async ({ page }) => {
		await navigateToTimeline(page, 'createWorld')

		await page.getByTestId('CreateEntityButton').click()
		await page.waitForTimeout(100)

		// Create event
		const textbox = page.getByTestId('RichTextEditor').getByRole('textbox')
		await textbox.pressSequentially('Event to nudge', { delay: 1 })
		await page.getByTestId('CreateEventModalConfirmButton').click()
		await page.waitForTimeout(500)

		// Select event
		await page.getByTestId('TimelineMarker').click()

		// Nudge event right (later)
		await page.keyboard.press('ArrowRight')

		await page.getByTestId('TimelineMarker').hover()
		await expect(page.getByRole('tooltip')).toHaveText(/00:05 January 01, 2026/)

		// Nudge event left (earlier)
		await page.keyboard.press('ArrowLeft')
		await page.keyboard.press('ArrowLeft')
		await page.getByTestId('TimelineMarker').hover()
		await expect(page.getByRole('tooltip').getByText(/23:55 December 31, 2025/)).toBeVisible()

		// Nudge event right with shift
		await page.keyboard.down('Shift')
		await page.keyboard.press('ArrowRight')
		await page.keyboard.press('ArrowRight')
		await page.keyboard.up('Shift')
		await page.getByTestId('TimelineMarker').hover()
		await expect(page.getByRole('tooltip').getByText(/00:25 January 01, 2026/)).toBeVisible()

		// Nudge event left with shift
		await page.keyboard.down('Shift')
		await page.keyboard.press('ArrowLeft')
		await page.keyboard.press('ArrowLeft')
		await page.keyboard.press('ArrowLeft')
		await page.keyboard.up('Shift')
		await page.getByTestId('TimelineMarker').hover()
		await expect(page.getByRole('tooltip').getByText(/23:40 December 31, 2025/)).toBeVisible()
	})

	test('nudging with event resolution time horizontally', async ({ page }) => {
		await navigateToTimeline(page, 'createWorld')

		await page.getByTestId('CreateEntityButton').click()
		await page.waitForTimeout(100)

		// Create event
		const textbox = page.getByTestId('RichTextEditor').getByRole('textbox')
		await textbox.pressSequentially('Event to nudge', { delay: 1 })
		await page.getByTestId('CreateEventModalConfirmButton').click()
		await page.waitForTimeout(500)

		// Resolve event
		await page.getByTestId('TimelineMarker').click()
		// Right click 100px to the right of the marker to click the resolve button
		const markerBoundingBox = await page.getByTestId('TimelineMarker').boundingBox()
		if (!markerBoundingBox) {
			throw new Error('Marker bounding box not found')
		}
		await page.mouse.click(
			markerBoundingBox.x + markerBoundingBox.width + 100,
			markerBoundingBox.y + markerBoundingBox.height / 2,
			{ button: 'right' },
		)
		await page.getByRole('menuitem', { name: 'Resolve event' }).click()

		// Check the resolve marker has the correct timestamp
		await page.getByTestId('TimelineMarker').nth(1).hover()
		await expect(page.getByRole('tooltip')).toHaveText(/00:30 January 01, 2026/)

		// Select event
		await page.getByTestId('TimelineMarker').nth(1).click()

		// Nudge event right (later)
		await page.keyboard.press('ArrowRight')

		await page.getByTestId('TimelineMarker').nth(1).hover()
		await expect(page.getByRole('tooltip')).toHaveText(/00:35 January 01, 2026/)

		// Nudge event left (earlier)
		await page.keyboard.press('ArrowLeft')
		await page.keyboard.press('ArrowLeft')
		await page.getByTestId('TimelineMarker').nth(1).hover()
		await expect(page.getByRole('tooltip').getByText(/00:25 January 01, 2026/)).toBeVisible()

		// Nudge event right with shift
		await page.keyboard.down('Shift')
		await page.keyboard.press('ArrowRight')
		await page.keyboard.press('ArrowRight')
		await page.keyboard.up('Shift')
		await page.getByTestId('TimelineMarker').nth(1).hover()
		await expect(page.getByRole('tooltip').getByText(/00:55 January 01, 2026/)).toBeVisible()

		// Nudge event left with shift
		await page.keyboard.down('Shift')
		await page.keyboard.press('ArrowLeft')
		await page.keyboard.press('ArrowLeft')
		await page.keyboard.press('ArrowLeft')
		await page.keyboard.up('Shift')
		await page.getByTestId('TimelineMarker').nth(1).hover()
		await expect(page.getByRole('tooltip').getByText(/00:10 January 01, 2026/)).toBeVisible()

		// Should not allow nudging beyond the timestamp
		await page.keyboard.down('Shift')
		await page.keyboard.press('ArrowLeft')
		await page.keyboard.press('ArrowLeft')
		await page.keyboard.press('ArrowLeft')
		await page.keyboard.up('Shift')

		await page.getByTestId('TimelineMarker').nth(1).hover()
		await expect(page.getByRole('tooltip').getByText(/00:10 January 01, 2026/)).toBeVisible()

		await page.keyboard.press('ArrowLeft')
		await page.keyboard.press('ArrowLeft')
		await page.keyboard.press('ArrowLeft')

		await page.getByTestId('TimelineMarker').nth(1).hover()
		await expect(page.getByRole('tooltip').getByText(/00:05 January 01, 2026/)).toBeVisible()

		// Move it back a little
		await page.keyboard.press('ArrowRight')

		// Should not allow nuding the main marker beyond the resolution time
		await page.getByTestId('TimelineMarker').nth(0).click()
		await page.keyboard.down('Shift')
		await page.keyboard.press('ArrowRight')
		await page.keyboard.press('ArrowRight')
		await page.keyboard.press('ArrowRight')
		await page.keyboard.up('Shift')

		await page.getByTestId('TimelineMarker').nth(0).hover()
		await expect(page.getByRole('tooltip').getByText(/00:00 January 01, 2026/)).toBeVisible()

		// Try moving withouth shift
		await page.keyboard.press('ArrowRight')
		await page.keyboard.press('ArrowRight')
		await page.keyboard.press('ArrowRight')

		await page.getByTestId('TimelineMarker').nth(0).hover()
		await expect(page.getByRole('tooltip').getByText(/00:05 January 01, 2026/)).toBeVisible()

		await page.keyboard.press('ArrowLeft')

		// Select both
		await page
			.getByTestId('TimelineMarker')
			.nth(1)
			.click({ modifiers: [multiselectModifier] })

		await page.keyboard.press('ArrowRight')
		await page.keyboard.press('ArrowRight')
		await page.keyboard.press('ArrowRight')

		await page.getByTestId('TimelineMarker').nth(0).hover()
		await expect(page.getByRole('tooltip').getByText(/00:15 January 01, 2026/)).toBeVisible()
		await page.getByTestId('TimelineMarker').nth(1).hover()
		await expect(page.getByRole('tooltip').getByText(/00:25 January 01, 2026/)).toBeVisible()

		// Move both by a lot and ensure the camera is moving
		await page.keyboard.down('Shift')
		for (let i = 0; i < 20; i++) {
			await page.keyboard.press('ArrowRight')
			await page.waitForTimeout(50)
		}
		await page.keyboard.up('Shift')

		// Scroll camera to center the events
		await page.keyboard.press('l')
		await page.waitForTimeout(100)

		await page.getByTestId('TimelineMarker').nth(0).hover()
		await expect(page.getByRole('tooltip').getByText(/05:15 January 01, 2026/)).toBeVisible()
		await page.getByTestId('TimelineMarker').nth(1).hover()
		await expect(page.getByRole('tooltip').getByText(/05:25 January 01, 2026/)).toBeVisible()
	})

	test('nudging events across tracks', async ({ page }) => {
		await navigateToTimeline(page, 'createWorld')

		// Open the event tracks modal
		await page.getByRole('button', { name: 'Manage event tracks...' }).click()
		await page.waitForTimeout(100)

		// Create two event tracks
		await page.getByRole('button', { name: 'Create new track' }).click()
		await page.waitForTimeout(100)
		await page.getByRole('textbox', { name: 'Name' }).fill('First track')
		await page.keyboard.press('Enter')
		await page.waitForTimeout(500)

		await page.getByRole('button', { name: 'Create new track' }).click()
		await page.waitForTimeout(100)
		await page.getByRole('textbox', { name: 'Name' }).fill('Second track')
		await page.keyboard.press('Enter')
		await page.waitForTimeout(500)

		// Close the event tracks modal
		await page.keyboard.press('Escape')
		await page.waitForTimeout(200)

		// Create an event in the default track
		await page.getByTestId('CreateEntityButton').click()
		const textbox = page.getByTestId('RichTextEditor').getByRole('textbox')
		await textbox.pressSequentially('Event to nudge', { delay: 1 })
		await page.getByTestId('CreateEventModalConfirmButton').click()
		await page.waitForTimeout(500)

		// Check the event is in the right track
		await expect(page.getByTestId('TimelineTrack').nth(2).getByTestId('TimelineMarker')).toBeVisible()

		// Select event
		await page.getByTestId('TimelineMarker').click()

		// Nudge event up
		await page.keyboard.press('ArrowUp')
		await expect(page.getByTestId('TimelineTrack').nth(1).getByTestId('TimelineMarker')).toBeVisible()
		await page.keyboard.press('ArrowUp')
		await expect(page.getByTestId('TimelineTrack').nth(0).getByTestId('TimelineMarker')).toBeVisible()

		// Try to nudge up (shouldn't move because it's already in the top track)
		await page.keyboard.press('ArrowUp')
		await page.keyboard.press('ArrowUp')
		await page.keyboard.press('ArrowUp')
		await expect(page.getByTestId('TimelineTrack').nth(0).getByTestId('TimelineMarker')).toBeVisible()

		// Nudge event down
		await page.keyboard.press('ArrowDown')
		await expect(page.getByTestId('TimelineTrack').nth(1).getByTestId('TimelineMarker')).toBeVisible()
		await page.keyboard.press('ArrowDown')
		await expect(page.getByTestId('TimelineTrack').nth(2).getByTestId('TimelineMarker')).toBeVisible()

		// Try to nudge down (shouldn't move because it's already in the bottom track)
		await page.keyboard.press('ArrowDown')
		await page.keyboard.press('ArrowDown')
		await page.keyboard.press('ArrowDown')
		await expect(page.getByTestId('TimelineTrack').nth(2).getByTestId('TimelineMarker')).toBeVisible()
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})
