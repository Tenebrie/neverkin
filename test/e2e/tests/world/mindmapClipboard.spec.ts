import assert from 'node:assert'

import { createNewUser, deleteAccount } from '@fixtures/auth'
import { installClipboardMock } from '@fixtures/clipboard'
import { createMindmapNode, createMindmapWires, multiselectWire } from '@fixtures/mindmap'
import { createActor, createWorld, navigateToMindmap } from '@fixtures/world'
import test, { expect } from '@playwright/test'
import { multiselectModifier } from '@tests/utils'

test.describe('Mindmap clipboard', () => {
	test.beforeEach(async ({ page, browserName }) => {
		if (browserName === 'firefox') {
			await installClipboardMock(page.context())
		}
		await createNewUser(page)
	})

	test('copy and paste puts the copies at the cursor', async ({ page }) => {
		const world = await createWorld(page)
		const actor = await createActor(page, world.id, { name: 'Actor' })
		const actorNode = await createMindmapNode(page, world.id, {
			parentActorId: actor.id,
			positionX: -350,
			positionY: -150,
		})
		const plainNode = await createMindmapNode(page, world.id, {
			name: 'Plain node',
			positionX: 50,
			positionY: -50,
		})
		await createMindmapWires(page, world.id, {
			wires: [{ sourceNodeId: actorNode.id, targetNodeId: plainNode.id }],
		})
		await navigateToMindmap(page, world)

		const actorCard = page.locator(`[data-mindmap-node="${actorNode.id}"]`)
		const plainCard = page.locator(`[data-mindmap-node="${plainNode.id}"]`)
		const wire = page.getByTestId('MindmapWire')
		await expect(wire).toHaveCount(1)

		const gridBox = await page.getByTestId('MindmapGrid').boundingBox()
		const actorBox = await actorCard.boundingBox()
		const plainBox = await plainCard.boundingBox()
		assert(gridBox)
		assert(actorBox)
		assert(plainBox)

		// --- Select both nodes and the wire between them, then copy ---
		await actorCard.locator('[data-mindmap-header]').click()
		await plainCard.locator('[data-mindmap-header]').click({ modifiers: [multiselectModifier] })
		await multiselectWire(wire)
		await page.keyboard.press('ControlOrMeta+c')

		// --- Paste at an empty spot ---
		const pasteX = gridBox.x + gridBox.width / 2
		const pasteY = gridBox.y + gridBox.height - 120
		const pasteResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' &&
				!!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes\/paste/),
		)
		await page.mouse.move(pasteX, pasteY)
		await page.keyboard.press('ControlOrMeta+v')
		await pasteResponse

		await expect(page.getByTestId('MindmapNode')).toHaveCount(4)
		await expect(page.getByTestId('MindmapWire')).toHaveCount(2)

		// --- The copies keep their layout and sit under the cursor ---
		const pastedNodes = page.locator('[data-mindmap-node][data-selected="true"]')
		await expect(pastedNodes).toHaveCount(2)
		const pastedActorBox = await pastedNodes.filter({ hasText: 'Actor' }).boundingBox()
		const pastedPlainBox = await pastedNodes.filter({ hasText: 'Plain node' }).boundingBox()
		assert(pastedActorBox)
		assert(pastedPlainBox)

		expect(pastedPlainBox.x - pastedActorBox.x).toBeCloseTo(plainBox.x - actorBox.x, 0)
		expect(pastedPlainBox.y - pastedActorBox.y).toBeCloseTo(plainBox.y - actorBox.y, 0)

		expect(pasteX).toBeGreaterThanOrEqual(pastedActorBox.x)
		expect(pasteX).toBeLessThanOrEqual(pastedPlainBox.x + pastedPlainBox.width)
		expect(pasteY).toBeGreaterThanOrEqual(pastedActorBox.y)
		expect(pasteY).toBeLessThanOrEqual(pastedPlainBox.y + pastedPlainBox.height)

		// --- The copy of the actor node is another card for the same actor ---
		await expect(page.getByTestId(/^ArticleListItem\/Actor\//)).toHaveCount(1)

		// --- Refresh and assert state persisted ---
		await page.reload()

		await expect(page.getByTestId('MindmapNode')).toHaveCount(4)
		await expect(page.getByTestId('MindmapWire')).toHaveCount(2)
		await expect(page.getByTestId(/^ArticleListItem\/Actor\//)).toHaveCount(1)
	})

	test('a selected wire to an uncopied node is reconnected, an unselected one is dropped', async ({
		page,
	}) => {
		const world = await createWorld(page)
		const copiedNode = await createMindmapNode(page, world.id, {
			name: 'Copied',
			positionX: -350,
			positionY: -200,
		})
		const selectedWireTarget = await createMindmapNode(page, world.id, {
			name: 'Selected wire target',
			positionX: 50,
			positionY: -50,
		})
		const unselectedWireTarget = await createMindmapNode(page, world.id, {
			name: 'Unselected wire target',
			positionX: -300,
			positionY: 150,
		})
		await createMindmapWires(page, world.id, {
			wires: [
				{ sourceNodeId: copiedNode.id, targetNodeId: selectedWireTarget.id },
				{ sourceNodeId: copiedNode.id, targetNodeId: unselectedWireTarget.id },
			],
		})
		await navigateToMindmap(page, world)

		const wires = page.getByTestId('MindmapWire')
		await expect(wires).toHaveCount(2)

		const gridBox = await page.getByTestId('MindmapGrid').boundingBox()
		const firstWireBox = await wires.nth(0).boundingBox()
		assert(gridBox)
		assert(firstWireBox)

		const isFirstWireTheSelectedOne = firstWireBox.width > firstWireBox.height
		const selectedWire = isFirstWireTheSelectedOne ? wires.nth(0) : wires.nth(1)

		// --- Select the copied node and its wire to the selected wire target, then copy ---
		await page.locator(`[data-mindmap-node="${copiedNode.id}"] [data-mindmap-header]`).click()
		await multiselectWire(selectedWire)
		await page.keyboard.press('ControlOrMeta+c')

		// --- Paste at an empty spot ---
		const pasteResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' &&
				!!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes\/paste/),
		)
		await page.mouse.move(gridBox.x + gridBox.width - 200, gridBox.y + gridBox.height - 120)
		await page.keyboard.press('ControlOrMeta+v')
		await pasteResponse

		// --- The two original wires, plus the copied node's wire to the selected wire target ---
		await expect(page.getByTestId('MindmapNode')).toHaveCount(4)
		await expect(page.getByTestId('MindmapWire')).toHaveCount(3)

		// --- Refresh and assert state persisted ---
		await page.reload()

		await expect(page.getByTestId('MindmapNode')).toHaveCount(4)
		await expect(page.getByTestId('MindmapWire')).toHaveCount(3)
	})

	test('cut removes the nodes and their wires, and paste brings them back', async ({ page }) => {
		const world = await createWorld(page)
		const actor = await createActor(page, world.id, { name: 'Actor' })
		const actorNode = await createMindmapNode(page, world.id, {
			parentActorId: actor.id,
			positionX: -350,
			positionY: -150,
		})
		const plainNode = await createMindmapNode(page, world.id, {
			name: 'Plain node',
			positionX: 50,
			positionY: -50,
		})
		await createMindmapWires(page, world.id, {
			wires: [{ sourceNodeId: actorNode.id, targetNodeId: plainNode.id }],
		})
		await navigateToMindmap(page, world)

		const wire = page.getByTestId('MindmapWire')
		await expect(wire).toHaveCount(1)

		const gridBox = await page.getByTestId('MindmapGrid').boundingBox()
		assert(gridBox)

		// --- Select both nodes and the wire between them, then cut ---
		await page.locator(`[data-mindmap-node="${actorNode.id}"] [data-mindmap-header]`).click()
		await page
			.locator(`[data-mindmap-node="${plainNode.id}"] [data-mindmap-header]`)
			.click({ modifiers: [multiselectModifier] })
		await multiselectWire(wire)
		await page.keyboard.press('ControlOrMeta+x')

		await expect(page.getByTestId('MindmapNode')).toHaveCount(0)
		await expect(page.getByTestId('MindmapWire')).toHaveCount(0)

		// --- The actor itself survives the cut ---
		await expect(page.getByTestId(/^ArticleListItem\/Actor\//)).toHaveCount(1)

		// --- Paste them back ---
		const pasteResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' &&
				!!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes\/paste/),
		)
		await page.mouse.move(gridBox.x + gridBox.width / 2, gridBox.y + gridBox.height / 2)
		await page.keyboard.press('ControlOrMeta+v')
		await pasteResponse

		await expect(page.getByTestId('MindmapNode')).toHaveCount(2)
		await expect(page.getByTestId('MindmapWire')).toHaveCount(1)

		// --- Refresh and assert state persisted ---
		await page.reload()

		await expect(page.getByTestId('MindmapNode')).toHaveCount(2)
		await expect(page.getByTestId('MindmapWire')).toHaveCount(1)
	})

	test('copy in one tab pastes in another', async ({ page }) => {
		const world = await createWorld(page)
		const node = await createMindmapNode(page, world.id, { name: 'Node', positionX: -150, positionY: -150 })
		await navigateToMindmap(page, world)

		const secondTab = await page.context().newPage()
		await navigateToMindmap(secondTab, world)
		await expect(secondTab.getByTestId('MindmapNode')).toHaveCount(1)

		const secondGridBox = await secondTab.getByTestId('MindmapGrid').boundingBox()
		assert(secondGridBox)

		// --- Copy in the first tab ---
		await page.locator(`[data-mindmap-node="${node.id}"] [data-mindmap-header]`).click()
		await page.keyboard.press('ControlOrMeta+c')

		// --- Paste in the second tab ---
		const pasteResponse = secondTab.waitForResponse(
			(res) =>
				res.request().method() === 'POST' &&
				!!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes\/paste/),
		)
		await secondTab.mouse.click(secondGridBox.x + 100, secondGridBox.y + secondGridBox.height - 100)
		await secondTab.keyboard.press('ControlOrMeta+v')
		await pasteResponse

		await expect(secondTab.getByTestId('MindmapNode')).toHaveCount(2)
		await expect(secondTab.getByTestId('MindmapNode').filter({ hasText: 'Node' })).toHaveCount(2)
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})
