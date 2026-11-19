import { expect, Locator, Page } from '@playwright/test'
import { makeUrl, multiselectModifier } from '@tests/utils'

import type {
	CreateMindmapWiresApiArg,
	CreateMindmapWiresApiResponse,
	CreateNodeApiArg,
	CreateNodeApiResponse,
} from '../../../app/styx-frontend/src/api/mindmapApi'

export async function createMindmapNode(page: Page, worldId: string, body: CreateNodeApiArg['body']) {
	return postJson<CreateNodeApiResponse>(page, `/api/world/${worldId}/mindmap/nodes`, body)
}

export async function createMindmapWires(
	page: Page,
	worldId: string,
	body: CreateMindmapWiresApiArg['body'],
) {
	return postJson<CreateMindmapWiresApiResponse>(page, `/api/world/${worldId}/mindmap/wires`, body)
}

export async function multiselectWire(wire: Locator, along = 0.5) {
	await wire.click({
		modifiers: [multiselectModifier],
		force: true,
		position: await wirePointAt(wire, along),
	})
}

export async function rightClickWire(wire: Locator) {
	await wire.click({ button: 'right', force: true, position: await wirePointAt(wire, 0.5) })
}

export async function doubleClickWire(wire: Locator, along = 0.5) {
	await wire.dblclick({ force: true, position: await wirePointAt(wire, along) })
}

/** The point `along` the wire's length, from 0 at the source to 1 at the target, relative to the path's box */
async function wirePointAt(wire: Locator, along: number) {
	return wire.evaluate((path, along: number) => {
		if (!(path instanceof SVGPathElement)) {
			throw new Error('MindmapWire is not an SVG path')
		}
		const point = path.getPointAtLength(path.getTotalLength() * along)
		const pathBox = path.getBBox()
		const screenBox = path.getBoundingClientRect()
		return {
			x: ((point.x - pathBox.x) / pathBox.width) * screenBox.width,
			y: ((point.y - pathBox.y) / pathBox.height) * screenBox.height,
		}
	}, along)
}

async function postJson<TResponse>(page: Page, path: string, body: object): Promise<TResponse> {
	const response = await page.request.post(makeUrl(path), { data: body })
	expect(response.ok(), `POST ${path} failed: ${response.status()}`).toBeTruthy()
	return (await response.json()) as TResponse
}
