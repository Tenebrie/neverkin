import { MindmapNode } from '@/api/types/mindmapTypes'

import { NODE_FALLBACK_H, NODE_W } from '../workspace/mindmapWireUtils'

const OUTLIER_DISTANCE_RATIO = 3

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number }
export type ContentBounds = { bounds: Bounds; mass: { x: number; y: number } }

/**
 * Bounding box of the nodes, ignoring far-flung outliers that would otherwise pull the box into empty space,
 * along with `mass` - the median node position. The box tells the camera how far to zoom out; `mass` tells it
 * where the nodes actually are, which is not the same point once the box is too wide to zoom out to.
 */
export function getMindmapContentBounds(nodes: MindmapNode[]): ContentBounds | null {
	if (nodes.length === 0) {
		return null
	}
	const center = {
		x: median(nodes.map((node) => node.positionX)),
		y: median(nodes.map((node) => node.positionY)),
	}
	const distances = nodes.map((node) => Math.hypot(node.positionX - center.x, node.positionY - center.y))
	const cutoff = OUTLIER_DISTANCE_RATIO * median(distances)
	const bounds = nodes
		.filter((_, index) => distances[index] <= cutoff)
		.reduce(
			(acc, node) => ({
				minX: Math.min(acc.minX, node.positionX),
				minY: Math.min(acc.minY, node.positionY),
				maxX: Math.max(acc.maxX, node.positionX + NODE_W),
				maxY: Math.max(acc.maxY, node.positionY + NODE_FALLBACK_H),
			}),
			{ minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
		)

	return { bounds, mass: { x: center.x + NODE_W / 2, y: center.y + NODE_FALLBACK_H / 2 } }
}

function median(values: number[]) {
	const sorted = values.toSorted((a, b) => a - b)
	return (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.ceil((sorted.length - 1) / 2)]) / 2
}
