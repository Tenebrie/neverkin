import { MindmapNode } from '@/api/types/mindmapTypes'
import { ReactiveMap } from '@/app/features/reactivity/ReactiveMap'
import { MindmapNodeLayout } from '@/app/views/world/views/mindmap/types'
import { WireControlPoints } from '@/app/views/world/views/mindmap/workspace/content/wires/canvas/MindmapCanvasMath'

export const NODE_W = 300
export const NODE_FALLBACK_H = 60
export const CORNER_R = 16

export function resolveNodeLayout(
	nodeLayouts: ReactiveMap<string, MindmapNodeLayout>,
	node: MindmapNode,
): MindmapNodeLayout {
	return (
		nodeLayouts.get(node.id) ?? {
			x: node.positionX,
			y: node.positionY,
			width: NODE_W,
			height: NODE_FALLBACK_H,
		}
	)
}

export function getLayoutCenter(layout: MindmapNodeLayout) {
	return { x: layout.x + layout.width / 2, y: layout.y + layout.height / 2 }
}

export type WireEndpoints = {
	x1: number
	y1: number
	x2: number
	y2: number
	nx1: number
	ny1: number
	nx2: number
	ny2: number
}

/**
 * Given a ray from the rect center toward a target point, find where it exits the
 * rounded-rect perimeter. On flat edges the exit is trivial; in corner regions the
 * ray is intersected with the corner arc so the attachment point slides smoothly.
 */
export function nearestEdgePoint(
	rect: MindmapNodeLayout,
	targetX: number,
	targetY: number,
): { x: number; y: number; nx: number; ny: number } {
	const cx = rect.x + rect.width / 2
	const cy = rect.y + rect.height / 2
	const dx = targetX - cx
	const dy = targetY - cy

	if (dx === 0 && dy === 0) {
		return { x: rect.x + rect.width, y: cy, nx: 1, ny: 0 }
	}

	const halfW = rect.width / 2
	const halfH = rect.height / 2
	const R = CORNER_R

	// Inner half-dimensions (inset by corner radius)
	const innerHalfW = halfW - R
	const innerHalfH = halfH - R

	// Find where the ray exits the sharp (non-rounded) rectangle
	const scaleX = dx !== 0 ? halfW / Math.abs(dx) : Infinity
	const scaleY = dy !== 0 ? halfH / Math.abs(dy) : Infinity
	const scale = Math.min(scaleX, scaleY)

	const edgeX = cx + dx * scale
	const edgeY = cy + dy * scale

	const relX = edgeX - cx
	const relY = edgeY - cy

	// Check if the sharp-rect exit falls inside a corner region
	if (Math.abs(relX) > innerHalfW && Math.abs(relY) > innerHalfH) {
		// Determine which corner arc to test
		const cornerCx = cx + Math.sign(relX) * innerHalfW
		const cornerCy = cy + Math.sign(relY) * innerHalfH

		// Ray–circle intersection: P(t) = (cx,cy) + t·(dx,dy), circle centered at corner with radius R
		const ox = cx - cornerCx
		const oy = cy - cornerCy

		const a = dx * dx + dy * dy
		const b = 2 * (ox * dx + oy * dy)
		const c = ox * ox + oy * oy - R * R

		const disc = b * b - 4 * a * c
		if (disc >= 0) {
			// Take the farther intersection — that's the outward-facing arc (the boundary)
			const t = (-b + Math.sqrt(disc)) / (2 * a)

			if (t > 0) {
				const px = cx + t * dx
				const py = cy + t * dy
				// Normal points radially outward from the arc center
				const nx = (px - cornerCx) / R
				const ny = (py - cornerCy) / R
				return { x: px, y: py, nx, ny }
			}
		}
	}

	// Flat edge — axis-aligned normal
	const nx = scaleX <= scaleY ? Math.sign(dx) : 0
	const ny = scaleX > scaleY ? Math.sign(dy) : 0

	return { x: edgeX, y: edgeY, nx, ny }
}

export function pickEdgePoints(source: MindmapNodeLayout, target: MindmapNodeLayout): WireEndpoints {
	const srcCenter = getLayoutCenter(source)
	const tgtCenter = getLayoutCenter(target)

	const src = nearestEdgePoint(source, tgtCenter.x, tgtCenter.y)
	const tgt = nearestEdgePoint(target, srcCenter.x, srcCenter.y)

	return { x1: src.x, y1: src.y, x2: tgt.x, y2: tgt.y, nx1: src.nx, ny1: src.ny, nx2: tgt.nx, ny2: tgt.ny }
}

/** A wire's look, drawn by `MindmapWireCanvas` */
export type WirePaint = {
	endpoints: WireEndpoints
	curve: WireControlPoints
	hasSourceArrow: boolean
	hasTargetArrow: boolean
	sourceColor: string
	midColor: string
	targetColor: string
	glowOpacity: number
	isActive: boolean
}

export function buildPathD({ x1, y1, cx1, cy1, cx2, cy2, x2, y2 }: WireControlPoints) {
	return `M ${x1},${y1} C ${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`
}
