import { MindmapNode } from '@/api/types/mindmapTypes'

import { NODE_FALLBACK_H, NODE_W } from '../content/nodes/ActorNode'

const OUTLIER_DISTANCE_RATIO = 3

type Point = { x: number; y: number }
export type ContentBounds = {
	size: { width: number; height: number }
	center: Point
	interestingPoint: Point
}

/**
 * Size and center of the nodes' bounding box, ignoring far-flung outliers
 *
 * Interesting point is a camera center when nodes can't all fit onto the screen.
 */
export function getMindmapContentBounds(nodes: MindmapNode[]): ContentBounds | null {
	if (nodes.length === 0) {
		return null
	}
	const medianPosition = {
		x: median(nodes.map((node) => node.positionX)),
		y: median(nodes.map((node) => node.positionY)),
	}
	const distances = nodes.map((node) =>
		Math.hypot(node.positionX - medianPosition.x, node.positionY - medianPosition.y),
	)
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

	return {
		size: { width: bounds.maxX - bounds.minX, height: bounds.maxY - bounds.minY },
		center: { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 },
		interestingPoint: { x: medianPosition.x + NODE_W / 2, y: medianPosition.y + NODE_FALLBACK_H / 2 },
	}
}

function median(values: number[]) {
	const sorted = values.toSorted((a, b) => a - b)
	return (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.ceil((sorted.length - 1) / 2)]) / 2
}
