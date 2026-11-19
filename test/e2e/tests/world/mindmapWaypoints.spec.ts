import assert from 'node:assert'

import { createNewUser, deleteAccount } from '@fixtures/auth'
import { createMindmapNode, createMindmapWires, doubleClickWire, multiselectWire } from '@fixtures/mindmap'
import { createWorld, navigateToMindmap } from '@fixtures/world'
import test, { expect, Locator, Page } from '@playwright/test'

test.describe('Mindmap waypoints', () => {
	test.beforeEach(async ({ page }) => {
		await createNewUser(page)
	})

	test('pins can be added, bundled, moved together and unbundled', async ({ page }) => {
		const world = await createWorld(page)
		const source = await createMindmapNode(page, world.id, {
			name: 'Source',
			positionX: -400,
			positionY: -200,
		})
		const upper = await createMindmapNode(page, world.id, { name: 'Upper', positionX: 200, positionY: -300 })
		const lower = await createMindmapNode(page, world.id, { name: 'Lower', positionX: 200, positionY: 100 })
		await createMindmapWires(page, world.id, {
			wires: [
				{ sourceNodeId: source.id, targetNodeId: upper.id },
				{ sourceNodeId: source.id, targetNodeId: lower.id },
			],
		})
		await navigateToMindmap(page, world)

		const wires = page.getByTestId('MindmapWire')
		const pins = page.getByTestId('MindmapWireWaypoint')
		await expect(wires).toHaveCount(2)

		// --- Double-clicking a wire adds one pin to it ---
		const firstCreate = waitForPost(page, /\/mindmap\/waypoints$/)
		await doubleClickWire(wires.nth(0))
		await firstCreate
		await expect(pins).toHaveCount(1)

		// --- With both wires selected, double-clicking one pins both at the same spot ---
		await multiselectWire(wires.nth(0), 0.25)
		await multiselectWire(wires.nth(1), 0.5)
		const bundleCreate = waitForPost(page, /\/mindmap\/waypoints$/)
		await doubleClickWire(wires.nth(1))
		await bundleCreate
		await expect(pins).toHaveCount(3)

		const placed = await positionsOf(pins)
		const bundle = indicesSharingAPosition(placed)
		expect(bundle).toHaveLength(2)
		const [lonePin] = [0, 1, 2].filter((index) => !bundle.includes(index))

		// --- Dragging the bundle moves both of its pins and nothing else ---
		const bundleMove = waitForPost(page, /\/mindmap\/move$/)
		await dragBy(page, pins.nth(bundle[0]), { x: 60, y: 40 })
		await bundleMove

		const afterBundleMove = await positionsOf(pins)
		expect(afterBundleMove[bundle[0]]).toEqual(afterBundleMove[bundle[1]])
		expect(afterBundleMove[bundle[0]]).not.toEqual(placed[bundle[0]])
		expect(afterBundleMove[lonePin]).toEqual(placed[lonePin])

		// --- Moving a node alone leaves every pin where it is ---
		const nodeMove = waitForPost(page, /\/mindmap\/move$/)
		const sourceHeader = page.locator(`[data-mindmap-node="${source.id}"] [data-mindmap-header]`)
		await dragBy(page, sourceHeader, { x: 0, y: 80 })
		await nodeMove

		expect(await positionsOf(pins)).toEqual(afterBundleMove)

		// --- Unbundling from the pin's menu removes both bundled pins ---
		const unbundle = waitForPost(page, /\/mindmap\/waypoints\/delete$/)
		await pins.nth(bundle[0]).click({ button: 'right', force: true })
		await page.getByRole('menuitem', { name: 'Unbundle 2 links' }).click()
		await unbundle
		await expect(pins).toHaveCount(1)

		// --- Refresh and assert state persisted ---
		await page.reload()

		await expect(page.getByTestId('MindmapWire')).toHaveCount(2)
		await expect(page.getByTestId('MindmapWireWaypoint')).toHaveCount(1)
	})

	test.afterEach(async ({ page }) => {
		await deleteAccount(page)
	})
})

function waitForPost(page: Page, path: RegExp) {
	return page.waitForResponse((res) => res.request().method() === 'POST' && path.test(res.url()))
}

async function dragBy(page: Page, target: Locator, offset: { x: number; y: number }) {
	const box = await target.boundingBox()
	assert(box)
	const startX = box.x + box.width / 2
	const startY = box.y + box.height / 2
	await page.mouse.move(startX, startY)
	await page.mouse.down()
	await page.mouse.move(startX + offset.x, startY + offset.y, { steps: 10 })
	await page.mouse.up()
}

/** Each pin's placement on the map, as the transform the handle is drawn with */
async function positionsOf(pins: Locator) {
	return pins.evaluateAll((elements) => elements.map((element) => element.getAttribute('transform')))
}

function indicesSharingAPosition(positions: (string | null)[]) {
	return positions
		.map((position, index) => ({ position, index }))
		.filter(({ position }) => positions.filter((other) => other === position).length > 1)
		.map(({ index }) => index)
}
