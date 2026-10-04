import assert from 'node:assert'

import { createNewUser, deleteAccount } from '@fixtures/auth'
import { createMindmapNode, createMindmapWires } from '@fixtures/mindmap'
import { createActor, createWorld, navigateToMindmap } from '@fixtures/world'
import test, { expect } from '@playwright/test'

test.describe('Mindmap node editing', () => {
	test.beforeEach(async ({ page }) => {
		await createNewUser(page)
	})

	test('pressing E on a plain node renames it in place', async ({ page }) => {
		const world = await createWorld(page)
		const plainNode = await createMindmapNode(page, world.id, {
			name: 'Unnamed thought',
			positionX: -150,
			positionY: -100,
		})
		await navigateToMindmap(page, world)

		const plainCard = page.locator(`[data-mindmap-node="${plainNode.id}"]`)
		await expect(plainCard).toHaveText('Unnamed thought')

		// --- Select the node and press E ---
		await plainCard.locator('[data-mindmap-header]').click()
		await expect(plainCard).toHaveAttribute('data-selected', 'true')
		await page.keyboard.press('e')

		const nameInput = plainCard.locator('textarea')
		await expect(nameInput).toBeFocused()

		// --- Type a new name and confirm ---
		const updateNodeResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'PATCH' &&
				!!res.url().match(new RegExp(`/api/world/[a-zA-Z0-9-]+/mindmap/nodes/${plainNode.id}$`)),
		)
		await nameInput.fill('Named thought')
		await nameInput.press('Enter')
		await updateNodeResponse

		await expect(nameInput).toBeHidden()
		await expect(plainCard).toHaveText('Named thought')

		// --- Refresh and assert state persisted ---
		await page.reload()

		await expect(plainCard).toHaveText('Named thought')
	})

	test('pressing E on an actor node opens the actor', async ({ page }) => {
		const world = await createWorld(page)
		const actor = await createActor(page, world.id, { name: 'Actor' })
		const actorNode = await createMindmapNode(page, world.id, {
			parentActorId: actor.id,
			positionX: -150,
			positionY: -100,
		})
		await navigateToMindmap(page, world)

		const actorCard = page.locator(`[data-mindmap-node="${actorNode.id}"]`)

		// --- Select the node and press E ---
		await actorCard.locator('[data-mindmap-header]').click()
		await expect(actorCard).toHaveAttribute('data-selected', 'true')
		await page.keyboard.press('e')

		await expect(page.getByTestId('ModalBackdrop').getByRole('heading', { name: 'Actor' })).toBeVisible()
	})

	test('dropping an outliner entity onto a node makes the node represent it', async ({ page }) => {
		const world = await createWorld(page)
		await createActor(page, world.id, { name: 'Actor' })
		const placeholderNode = await createMindmapNode(page, world.id, {
			name: 'Placeholder',
			positionX: -350,
			positionY: -150,
		})
		const neighbourNode = await createMindmapNode(page, world.id, {
			name: 'Neighbour',
			positionX: 50,
			positionY: -50,
		})
		await createMindmapWires(page, world.id, {
			wires: [{ sourceNodeId: placeholderNode.id, targetNodeId: neighbourNode.id }],
		})
		await navigateToMindmap(page, world)

		const placeholderCard = page.locator(`[data-mindmap-node="${placeholderNode.id}"]`)
		await expect(placeholderCard).toHaveText('Placeholder')
		await expect(page.getByTestId('MindmapWire')).toHaveCount(1)

		// --- Drag the actor from the outliner onto the placeholder ---
		const placeholderBox = await placeholderCard.boundingBox()
		assert(placeholderBox)

		const reparentResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' &&
				!!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes\/[a-zA-Z0-9-]+\/reparent/),
		)
		await page.getByTestId('ArticleListItem/Actor/0').hover()
		await page.mouse.down()
		await page.mouse.move(
			placeholderBox.x + placeholderBox.width / 2,
			placeholderBox.y + placeholderBox.height / 2,
			{ steps: 20 },
		)
		await page.mouse.up()
		await reparentResponse

		// --- The node now shows the actor and keeps its wire ---
		await expect(page.getByTestId('MindmapNode')).toHaveCount(2)
		await expect(page.getByTestId('MindmapNode').filter({ hasText: 'Placeholder' })).toHaveCount(0)
		await expect(page.getByTestId('MindmapNode').filter({ hasText: 'Actor' })).toHaveCount(1)
		await expect(page.getByTestId('MindmapWire')).toHaveCount(1)

		// --- Refresh and assert state persisted ---
		await page.reload()

		await expect(page.getByTestId('MindmapNode')).toHaveCount(2)
		await expect(page.getByTestId('MindmapNode').filter({ hasText: 'Actor' })).toHaveCount(1)
		await expect(page.getByTestId('MindmapWire')).toHaveCount(1)
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})
