import { createNewUser, deleteAccount } from '@fixtures/auth'
import { createActorAsUser, navigateToMindmap } from '@fixtures/world'
import test, { expect } from '@playwright/test'

test.describe('World Mindmap', () => {
	test.beforeEach(async ({ page }) => {
		await createNewUser(page)
	})

	test('full mindmap node and wire lifecycle', async ({ page }) => {
		await navigateToMindmap(page, 'createWorld')

		// --- Create first actor ---
		await createActorAsUser(page, 'Actor One')
		await expect(page.getByTestId('ArticleListItem/Actor One/0')).toBeVisible()

		// --- Create second actor ---
		await createActorAsUser(page, 'Actor Two')
		await expect(page.getByTestId('ArticleListItem/Actor Two/0')).toBeVisible()

		// --- Drag first actor from outliner to workspace ---
		const grid = page.getByTestId('MindmapGrid')
		const gridBox = await grid.boundingBox()
		expect(gridBox).toBeTruthy()

		// Placed proportionally: the sidebar width varies, and a fixed pixel gap can fall outside the grid
		const dropX1 = gridBox!.x + gridBox!.width * 0.3
		const dropY1 = gridBox!.y + gridBox!.height / 2

		const actorOneItem = page.getByTestId('ArticleListItem/Actor One/0')

		const createNodeResponse1 = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' && !!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes/),
		)
		await actorOneItem.hover()
		await page.mouse.down()
		await page.mouse.move(dropX1, dropY1, { steps: 20 })
		await page.mouse.up()
		await createNodeResponse1

		await expect(page.getByTestId('MindmapNode')).toHaveCount(1)

		const dropX2 = gridBox!.x + gridBox!.width * 0.75
		const dropY2 = dropY1

		const actorTwoItem = page.getByTestId('ArticleListItem/Actor Two/0')

		const createNodeResponse2 = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' && !!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes/),
		)
		await actorTwoItem.hover()
		await page.mouse.down()
		await page.mouse.move(dropX2, dropY2, { steps: 20 })
		await page.mouse.up()
		await createNodeResponse2

		await expect(page.getByTestId('MindmapNode')).toHaveCount(2)

		// --- Connect nodes via port drag ---
		const nodeOne = page.getByTestId('MindmapNode').nth(0)
		const nodeTwo = page.getByTestId('MindmapNode').nth(1)
		const portOne = nodeOne.getByTestId('MindmapNodePort')

		const nodeTwoBox = await nodeTwo.boundingBox()
		expect(nodeTwoBox).toBeTruthy()

		const createWireResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' && !!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/wires/),
		)
		await portOne.hover()
		await page.mouse.down()
		await page.mouse.move(nodeTwoBox!.x + nodeTwoBox!.width / 2, nodeTwoBox!.y + nodeTwoBox!.height / 2, {
			steps: 20,
		})
		await page.waitForTimeout(100)
		await nodeTwo.locator('[data-mindmap-header]').dispatchEvent('mouseup')
		await page.mouse.up()

		// Wire should appear immediately (optimistic update)
		await expect(page.getByTestId('MindmapWire')).toHaveCount(1)

		// Wait for network request to persist it
		await createWireResponse

		// --- Move first node 100px down ---
		const nodeOneHeader = nodeOne.locator('[data-mindmap-header]')
		const nodeOneBox = await nodeOneHeader.boundingBox()
		expect(nodeOneBox).toBeTruthy()

		const moveResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' &&
				!!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes\/move/),
		)

		await nodeOneHeader.hover()
		await page.mouse.down()
		await page.mouse.move(
			nodeOneBox!.x + nodeOneBox!.width / 2,
			nodeOneBox!.y + nodeOneBox!.height / 2 + 100,
			{ steps: 20 },
		)
		await page.mouse.up()
		await moveResponse

		// --- Refresh and assert state persisted ---
		await page.reload()
		await page.waitForTimeout(500)

		await expect(page.getByTestId('MindmapNode')).toHaveCount(2)
		await expect(page.getByTestId('MindmapWire')).toHaveCount(1)
		await expect(page.getByTestId('ArticleListItem/Actor One/0')).toBeVisible()
		await expect(page.getByTestId('ArticleListItem/Actor Two/0')).toBeVisible()

		// --- Delete the wire ---
		const wire = page.getByTestId('MindmapWire')
		await wire.click({ force: true })

		const deleteWireResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' &&
				!!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/wires\/delete/),
		)
		await page.keyboard.press('Delete')
		await deleteWireResponse

		await expect(page.getByTestId('MindmapWire')).toHaveCount(0)

		// --- Delete a node ---
		const nodeToDelete = page.getByTestId('MindmapNode').nth(0)
		const headerToClick = nodeToDelete.locator('[data-mindmap-header]')
		await headerToClick.click()

		const deleteNodeResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' &&
				!!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes\/delete/),
		)
		await page.keyboard.press('Delete')
		await deleteNodeResponse

		await expect(page.getByTestId('MindmapNode')).toHaveCount(1)

		// Delete the second node too
		const remainingNode = page.getByTestId('MindmapNode').nth(0)
		const remainingHeader = remainingNode.locator('[data-mindmap-header]')
		await remainingHeader.click()

		const deleteNodeResponse2 = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' &&
				!!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes\/delete/),
		)
		await page.keyboard.press('Delete')
		await deleteNodeResponse2

		await expect(page.getByTestId('MindmapNode')).toHaveCount(0)

		// --- Refresh and assert final state ---
		await page.reload()
		await page.waitForTimeout(500)

		await expect(page.getByTestId('MindmapNode')).toHaveCount(0)
		await expect(page.getByTestId('MindmapWire')).toHaveCount(0)

		// Actors still exist in outliner
		await expect(page.getByTestId('ArticleListItem/Actor One/0')).toBeVisible()
		await expect(page.getByTestId('ArticleListItem/Actor Two/0')).toBeVisible()
	})

	test('mass selection, move, wire toggle, and delete', async ({ page }) => {
		await navigateToMindmap(page, 'createWorld')

		// --- Create 4 actors ---
		const actorNames = ['Alpha', 'Beta', 'Gamma', 'Delta']
		for (const name of actorNames) {
			await createActorAsUser(page, name)
			await expect(page.getByTestId(`ArticleListItem/${name}/0`)).toBeVisible()
		}

		// --- Drop all 4 actors onto the grid as nodes ---
		const grid = page.getByTestId('MindmapGrid')
		const gridBox = await grid.boundingBox()
		expect(gridBox).toBeTruthy()

		// Position them in a 2x2 grid pattern, spaced well apart
		const positions = [
			{ x: gridBox!.x + gridBox!.width / 2 - 200, y: gridBox!.y + gridBox!.height / 2 - 150 },
			{ x: gridBox!.x + gridBox!.width / 2 + 200, y: gridBox!.y + gridBox!.height / 2 - 150 },
			{ x: gridBox!.x + gridBox!.width / 2 - 200, y: gridBox!.y + gridBox!.height / 2 + 150 },
			{ x: gridBox!.x + gridBox!.width / 2 + 200, y: gridBox!.y + gridBox!.height / 2 + 150 },
		]

		for (let i = 0; i < actorNames.length; i++) {
			const actorItem = page.getByTestId(`ArticleListItem/${actorNames[i]}/0`)

			const createNodeRequest = page.waitForRequest(
				(req) => req.method() === 'POST' && !!req.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes/),
			)
			await actorItem.hover()
			await page.mouse.down()
			await page.mouse.move(positions[i].x, positions[i].y, { steps: 20 })
			await page.mouse.up()
			await createNodeRequest

			await expect(page.getByTestId('MindmapNode')).toHaveCount(i + 1)
		}

		// --- Select all 4 nodes using a selection box ---
		// Draw a selection box that covers all nodes (start from top-left corner to bottom-right)
		const margin = 150
		const selStartX = gridBox!.x + gridBox!.width / 2 - 200 - margin
		const selStartY = gridBox!.y + gridBox!.height / 2 - 150 - margin
		const selEndX = gridBox!.x + gridBox!.width / 2 + 200 + margin
		const selEndY = gridBox!.y + gridBox!.height / 2 + 150 + margin

		await page.mouse.move(selStartX, selStartY, { steps: 5 })
		await page.mouse.down()
		await page.mouse.move(selEndX, selEndY, { steps: 30 })
		await page.mouse.up()

		// All 4 nodes should now be selected (verify via outline color)
		// We verify indirectly: moving one node should move all

		// --- Move one selected node and verify all move together ---
		const firstNode = page.getByTestId('MindmapNode').nth(0)
		const firstNodeHeader = firstNode.locator('[data-mindmap-header]')
		const firstNodeBox = await firstNodeHeader.boundingBox()
		expect(firstNodeBox).toBeTruthy()

		// Record positions of all nodes before moving
		const nodesBefore: { x: number; y: number; width: number; height: number }[] = []
		for (let i = 0; i < 4; i++) {
			const box = await page.getByTestId('MindmapNode').nth(i).boundingBox()
			expect(box).toBeTruthy()
			nodesBefore.push(box!)
		}

		const moveRequest = page.waitForRequest(
			(req) =>
				req.method() === 'POST' && !!req.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes\/move/),
		)
		await firstNodeHeader.hover()
		await page.mouse.down()
		await page.mouse.move(
			firstNodeBox!.x + firstNodeBox!.width / 2,
			firstNodeBox!.y + firstNodeBox!.height / 2 + 80,
			{ steps: 20 },
		)
		await page.mouse.up()
		await moveRequest

		// Verify all nodes moved down by ~80px
		for (let i = 0; i < 4; i++) {
			const boxAfter = await page.getByTestId('MindmapNode').nth(i).boundingBox()
			expect(boxAfter).toBeTruthy()
			expect(boxAfter!.y).toBeGreaterThan(nodesBefore[i].y + 30)
		}

		// --- Re-select all nodes (previous selection may have been cleared) ---
		await page.mouse.move(selStartX, selStartY, { steps: 5 })
		await page.mouse.down()
		await page.mouse.move(selEndX, selEndY, { steps: 30 })
		await page.mouse.up()
		await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
		await expect(page.locator('[data-mindmap-node][data-selected="true"]')).toHaveCount(4)

		// --- Create wires by dragging from a selected node's port to a target node ---
		// Pick the last node (Delta) as the target. The other 3 selected nodes should each get a wire to it.
		const targetNode = page.getByTestId('MindmapNode').nth(3)
		const sourceNode = page.getByTestId('MindmapNode').nth(0)
		const sourcePort = sourceNode.getByTestId('MindmapNodePort')

		const targetNodeBox = await targetNode.boundingBox()
		expect(targetNodeBox).toBeTruthy()

		const createWiresRequest = page.waitForRequest(
			(req) => req.method() === 'POST' && !!req.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/wires/),
		)
		await sourcePort.hover()
		await page.mouse.down()
		await page.mouse.move(
			targetNodeBox!.x + targetNodeBox!.width / 2,
			targetNodeBox!.y + targetNodeBox!.height / 2,
			{ steps: 20 },
		)
		await page.waitForTimeout(100)
		await targetNode.locator('[data-mindmap-header]').dispatchEvent('mouseup')
		await page.mouse.up()
		await createWiresRequest

		// Should create 3 wires (from Alpha, Beta, Gamma to Delta — not Delta to itself)
		await expect(page.getByTestId('MindmapWire')).toHaveCount(3)

		// --- Re-select all nodes again ---
		await page.mouse.move(selStartX, selStartY, { steps: 5 })
		await page.mouse.down()
		await page.mouse.move(selEndX, selEndY, { steps: 30 })
		await page.mouse.up()

		// --- Repeat the wire action — should delete the wires (toggle) ---
		const deleteWiresRequest = page.waitForRequest(
			(req) =>
				req.method() === 'POST' && !!req.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/wires\/delete/),
		)
		await sourcePort.hover()
		await page.mouse.down()
		await page.mouse.move(
			targetNodeBox!.x + targetNodeBox!.width / 2,
			targetNodeBox!.y + targetNodeBox!.height / 2,
			{ steps: 20 },
		)
		await page.waitForTimeout(100)
		await targetNode.locator('[data-mindmap-header]').dispatchEvent('mouseup')
		await page.mouse.up()
		await deleteWiresRequest

		await expect(page.getByTestId('MindmapWire')).toHaveCount(0)

		// --- Select all nodes and delete them ---
		await page.mouse.move(selStartX, selStartY, { steps: 5 })
		await page.mouse.down()
		await page.mouse.move(selEndX, selEndY, { steps: 30 })
		await page.mouse.up()

		const deleteNodesRequest = page.waitForRequest(
			(req) =>
				req.method() === 'POST' && !!req.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes\/delete/),
		)
		await page.keyboard.press('Delete')
		await deleteNodesRequest

		await expect(page.getByTestId('MindmapNode')).toHaveCount(0)

		// Actors still exist in outliner
		for (const name of actorNames) {
			await expect(page.getByTestId(`ArticleListItem/${name}/0`)).toBeVisible()
		}
	})

	test('plain node lifecycle', async ({ page }) => {
		await navigateToMindmap(page, 'createWorld')

		const grid = page.getByTestId('MindmapGrid')
		const gridBox = await grid.boundingBox()
		expect(gridBox).toBeTruthy()

		const spawnX = gridBox!.x + gridBox!.width / 2
		const spawnY = gridBox!.y + gridBox!.height / 2

		// --- Welcome state is offered while the map is empty and nothing is typed ---
		await page.mouse.move(spawnX, spawnY)
		await page.keyboard.press(' ')
		const welcomeState = page.getByTestId('QuickSelectListWelcomeState')
		await expect(welcomeState).toBeVisible()

		// --- Quick create a plain node, which has no backing entity ---
		const createNodeResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' && !!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes/),
		)
		await page.keyboard.type('Quick draft')
		await expect(welcomeState).toBeHidden()
		await page.getByRole('menuitem').filter({ hasText: 'Node:' }).click()
		await createNodeResponse

		const node = page.getByTestId('MindmapNode')
		await expect(node).toHaveCount(1)
		await expect(node.getByText('Quick draft')).toBeVisible()

		const nodeId = (await node.getAttribute('data-mindmap-node'))!

		// --- A plain node is not an actor, so it stays out of the outliner ---
		await expect(page.getByTestId(/^ArticleListItem/)).toHaveCount(0)

		// --- Rename the node inline ---
		await node.getByText('Quick draft').click({ button: 'right' })
		await page.getByRole('menuitem', { name: 'Edit', exact: true }).click()
		const nameInput = node.locator('textarea')
		await expect(nameInput).toBeFocused()

		const updateNodeResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'PATCH' &&
				!!res.url().match(new RegExp(`/api/world/[a-zA-Z0-9-]+/mindmap/nodes/${nodeId}$`)),
		)
		await nameInput.fill('Renamed draft')
		await nameInput.press('Enter')
		await updateNodeResponse
		await expect(nameInput).toHaveCount(0)
		await expect(node.getByText('Renamed draft')).toBeVisible()

		// --- The new name survives a reload, so it came back from the database ---
		await page.reload()
		await expect(node.getByText('Renamed draft')).toBeVisible()

		// --- Delete the node ---
		await node.getByText('Renamed draft').click()

		const deleteNodeResponse = page.waitForResponse(
			(res) =>
				res.request().method() === 'POST' &&
				!!res.url().match(/\/api\/world\/[a-zA-Z0-9-]+\/mindmap\/nodes\/delete/),
		)
		await page.keyboard.press('Delete')
		await deleteNodeResponse
		await expect(node).toHaveCount(0)

		await page.reload()
		await expect(page.getByTestId('MindmapNode')).toHaveCount(0)
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})
