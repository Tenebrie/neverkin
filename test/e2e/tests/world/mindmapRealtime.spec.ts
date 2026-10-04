import assert from 'node:assert'

import { createNewUser, deleteAccount } from '@fixtures/auth'
import { createMindmapNode, rightClickWire } from '@fixtures/mindmap'
import { createWorld, navigateToMindmap } from '@fixtures/world'
import test, { expect } from '@playwright/test'

test.describe('Mindmap realtime', () => {
	test.beforeEach(async ({ page }) => {
		await createNewUser(page)
	})

	test('node changes in one tab show up in another', async ({ page }) => {
		const world = await createWorld(page)
		await navigateToMindmap(page, world)
		const otherTab = await page.context().newPage()
		await navigateToMindmap(otherTab, world)

		const gridBox = await page.getByTestId('MindmapGrid').boundingBox()
		assert(gridBox)

		// --- Create a node ---
		const createNodeResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' &&
				!!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes$/),
		)
		await page.mouse.move(gridBox.x + gridBox.width / 2, gridBox.y + gridBox.height / 2)
		await page.keyboard.press(' ')
		await expect(page.getByTestId('QuickSelectListWelcomeState')).toBeVisible()
		await page.keyboard.type('Shared thought')
		await page.getByRole('menuitem').filter({ hasText: 'Node:' }).click()
		await createNodeResponse

		const nodeId = await page.getByTestId('MindmapNode').getAttribute('data-mindmap-node')
		const card = page.locator(`[data-mindmap-node="${nodeId}"]`)
		const cardInOtherTab = otherTab.locator(`[data-mindmap-node="${nodeId}"]`)
		await expect(cardInOtherTab).toHaveText('Shared thought')

		// --- Rename it ---
		await card.locator('[data-mindmap-header]').click()
		await expect(card).toHaveAttribute('data-selected', 'true')
		await page.keyboard.press('e')

		const renameResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'PATCH' &&
				!!res.url().match(new RegExp(`/api/world/[a-zA-Z0-9-]+/mindmap/nodes/${nodeId}$`)),
		)
		await card.locator('textarea').fill('Renamed thought')
		await card.locator('textarea').press('Enter')
		await renameResponse

		await expect(cardInOtherTab).toHaveText('Renamed thought')

		// --- Move it ---
		const boxInOtherTabBeforeMove = await cardInOtherTab.boundingBox()
		const boxBeforeMove = await card.boundingBox()
		assert(boxInOtherTabBeforeMove)
		assert(boxBeforeMove)

		const moveResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' &&
				!!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes\/move/),
		)
		await card.locator('[data-mindmap-header]').hover()
		await page.mouse.down()
		await page.mouse.move(
			boxBeforeMove.x + boxBeforeMove.width / 2,
			boxBeforeMove.y + boxBeforeMove.height / 2 + 150,
			{ steps: 20 },
		)
		await page.mouse.up()
		await moveResponse

		await expect
			.poll(async () => (await cardInOtherTab.boundingBox())?.y)
			.toBeGreaterThan(boxInOtherTabBeforeMove.y + 100)

		// --- Delete it ---
		const deleteResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' &&
				!!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes\/delete/),
		)
		await card.locator('[data-mindmap-header]').click({ button: 'right' })
		await page.getByRole('menuitem', { name: 'Delete node' }).click()
		await deleteResponse

		await expect(otherTab.getByTestId('MindmapNode')).toHaveCount(0)
	})

	test('wire changes in one tab show up in another', async ({ page }) => {
		const world = await createWorld(page)
		const sourceNode = await createMindmapNode(page, world.id, {
			name: 'Source',
			positionX: -350,
			positionY: -150,
		})
		const targetNode = await createMindmapNode(page, world.id, {
			name: 'Target',
			positionX: 50,
			positionY: -50,
		})
		await navigateToMindmap(page, world)
		const otherTab = await page.context().newPage()
		await navigateToMindmap(otherTab, world)

		await expect(otherTab.getByTestId('MindmapNode')).toHaveCount(2)
		await expect(otherTab.getByTestId('MindmapWire')).toHaveCount(0)

		// --- Connect the two nodes by dragging from the source's port ---
		const targetBox = await page.locator(`[data-mindmap-node="${targetNode.id}"]`).boundingBox()
		assert(targetBox)

		const createWireResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' &&
				!!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/wires$/),
		)
		await page.locator(`[data-mindmap-node="${sourceNode.id}"]`).getByTestId('MindmapNodePort').hover()
		await page.mouse.down()
		await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
			steps: 20,
		})
		await page.mouse.up()
		await createWireResponse

		await expect(otherTab.getByTestId('MindmapWire')).toHaveCount(1)

		// --- Delete the wire from its menu ---
		const deleteWireResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' &&
				!!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/wires\/delete/),
		)
		await rightClickWire(page.getByTestId('MindmapWire'))
		await page.getByRole('menuitem', { name: 'Delete link' }).click()
		await deleteWireResponse

		await expect(otherTab.getByTestId('MindmapWire')).toHaveCount(0)
		await expect(otherTab.getByTestId('MindmapNode')).toHaveCount(2)
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})
