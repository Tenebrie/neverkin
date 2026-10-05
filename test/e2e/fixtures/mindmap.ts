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

export async function multiselectWire(wire: Locator) {
	await wire.click({ modifiers: [multiselectModifier], force: true, position: await wireMidpoint(wire) })
}

export async function rightClickWire(wire: Locator) {
	await wire.click({ button: 'right', force: true, position: await wireMidpoint(wire) })
}

async function wireMidpoint(wire: Locator) {
	return wire.evaluate((path) => {
		if (!(path instanceof SVGPathElement)) {
			throw new Error('MindmapWire is not an SVG path')
		}
		const point = path.getPointAtLength(path.getTotalLength() / 2)
		const pathBox = path.getBBox()
		const screenBox = path.getBoundingClientRect()
		return {
			x: ((point.x - pathBox.x) / pathBox.width) * screenBox.width,
			y: ((point.y - pathBox.y) / pathBox.height) * screenBox.height,
		}
	})
}

async function postJson<TResponse>(page: Page, path: string, body: object): Promise<TResponse> {
	const response = await page.request.post(makeUrl(path), { data: body })
	expect(response.ok(), `POST ${path} failed: ${response.status()}`).toBeTruthy()
	return (await response.json()) as TResponse
}
