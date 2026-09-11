import { MindmapNode } from '@/api/types/mindmapTypes'

import { NODE_FALLBACK_H, NODE_W } from '../workspace/mindmapWireUtils'

const OUTLIER_DISTANCE_RATIO = 3

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number }

/**
 * Bounding box of the nodes, ignoring far-flung outliers that would otherwise pull the box into empty space.
 */
export function getMindmapContentBounds(nodes: MindmapNode[]): Bounds | null {
	if (nodes.length === 0) {
		return null
	}
	const center = {
		x: median(nodes.map((node) => node.positionX)),
		y: median(nodes.map((node) => node.positionY)),
	}
	const distances = nodes.map((node) => Math.hypot(node.positionX - center.x, node.positionY - center.y))
	const cutoff = OUTLIER_DISTANCE_RATIO * median(distances)
	return nodes
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
}

function median(values: number[]) {
	const sorted = values.toSorted((a, b) => a - b)
	return (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.ceil((sorted.length - 1) / 2)]) / 2
}
