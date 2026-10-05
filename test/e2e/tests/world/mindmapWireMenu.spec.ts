import assert from 'node:assert'

import { createNewUser, deleteAccount } from '@fixtures/auth'
import { createMindmapNode, createMindmapWires, rightClickWire } from '@fixtures/mindmap'
import { createWorld, navigateToMindmap } from '@fixtures/world'
import test, { expect } from '@playwright/test'

test.describe('Mindmap wire menu', () => {
	test.beforeEach(async ({ page }) => {
		await createNewUser(page)
	})

	test('a label typed into the wire menu shows on the map', async ({ page }) => {
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
		await createMindmapWires(page, world.id, {
			wires: [{ sourceNodeId: sourceNode.id, targetNodeId: targetNode.id }],
		})
		await navigateToMindmap(page, world)

		const wire = page.getByTestId('MindmapWire')
		await expect(wire).toHaveCount(1)

		// --- Open the wire menu and type a label ---
		await rightClickWire(wire)
		await page.getByLabel('Label').fill('Allied with')

		// --- Confirm with Enter ---
		const updateWireResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'PATCH' &&
				!!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/wires\/[a-zA-Z0-9-]+$/),
		)
		await page.keyboard.press('Enter')
		await updateWireResponse

		await expect(page.getByLabel('Label')).toBeHidden()
		await expect(page.getByText('Allied with')).toBeVisible()

		// --- Refresh and assert state persisted ---
		await page.reload()

		await expect(page.getByText('Allied with')).toBeVisible()
	})

	test('splitting a wire puts a new node between its two ends', async ({ page }) => {
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
		await createMindmapWires(page, world.id, {
			wires: [{ sourceNodeId: sourceNode.id, targetNodeId: targetNode.id }],
		})
		await navigateToMindmap(page, world)

		const wire = page.getByTestId('MindmapWire')
		await expect(wire).toHaveCount(1)

		// --- Name the wire, then split it ---
		await rightClickWire(wire)
		await page.getByLabel('Label').fill('Midpoint')

		const splitWireResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' &&
				!!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/wires\/[a-zA-Z0-9-]+\/split/),
		)
		await page.getByRole('menuitem', { name: 'Split' }).click()
		await splitWireResponse

		// --- The new node takes the wire's label and sits between the two ends ---
		await expect(page.getByTestId('MindmapNode')).toHaveCount(3)
		await expect(page.getByTestId('MindmapWire')).toHaveCount(2)

		const sourceBox = await page.locator(`[data-mindmap-node="${sourceNode.id}"]`).boundingBox()
		const targetBox = await page.locator(`[data-mindmap-node="${targetNode.id}"]`).boundingBox()
		const splitNodeBox = await page.getByTestId('MindmapNode').filter({ hasText: 'Midpoint' }).boundingBox()
		assert(sourceBox)
		assert(targetBox)
		assert(splitNodeBox)

		const splitNodeCenterX = splitNodeBox.x + splitNodeBox.width / 2
		expect(splitNodeCenterX).toBeGreaterThan(sourceBox.x + sourceBox.width / 2)
		expect(splitNodeCenterX).toBeLessThan(targetBox.x + targetBox.width / 2)

		// --- Refresh and assert state persisted ---
		await page.reload()

		await expect(page.getByTestId('MindmapNode')).toHaveCount(3)
		await expect(page.getByTestId('MindmapWire')).toHaveCount(2)
		await expect(page.getByTestId('MindmapNode').filter({ hasText: 'Midpoint' })).toBeVisible()
	})

	test('deleting a wire from its menu leaves both nodes in place', async ({ page }) => {
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
		await createMindmapWires(page, world.id, {
			wires: [{ sourceNodeId: sourceNode.id, targetNodeId: targetNode.id }],
		})
		await navigateToMindmap(page, world)

		const wire = page.getByTestId('MindmapWire')
		await expect(wire).toHaveCount(1)

		// --- Delete the wire from its menu ---
		await rightClickWire(wire)

		const deleteWireResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' &&
				!!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/wires\/delete/),
		)
		await page.getByRole('menuitem', { name: 'Delete link' }).click()
		await deleteWireResponse

		await expect(page.getByTestId('MindmapWire')).toHaveCount(0)
		await expect(page.getByTestId('MindmapNode')).toHaveCount(2)

		// --- Refresh and assert state persisted ---
		await page.reload()

		await expect(page.getByTestId('MindmapWire')).toHaveCount(0)
		await expect(page.getByTestId('MindmapNode')).toHaveCount(2)
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})
