import { MindmapState } from '../MindmapState'
import {
	bezierPoint,
	midpointOf,
	toControlPoints,
	WireControlPoints,
} from '../workspace/content/wires/canvas/MindmapCanvasMath'

export const NODE_W = 300
export const NODE_FALLBACK_H = 60
export const CORNER_R = 16

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

export function getNodeHeight(nodeId: string): number {
	const el = document.querySelector(`[data-mindmap-node="${nodeId}"]`)
	if (!el) {
		return NODE_FALLBACK_H
	}
	return el.getBoundingClientRect().height / MindmapState.scale
}

/**
 * Given a ray from the rect center toward a target point, find where it exits the
 * rounded-rect perimeter. On flat edges the exit is trivial; in corner regions the
 * ray is intersected with the corner arc so the attachment point slides smoothly.
 */
export function nearestEdgePoint(
	rectX: number,
	rectY: number,
	nodeH: number,
	targetX: number,
	targetY: number,
): { x: number; y: number; nx: number; ny: number } {
	const cx = rectX + NODE_W / 2
	const cy = rectY + nodeH / 2
	const dx = targetX - cx
	const dy = targetY - cy

	if (dx === 0 && dy === 0) {
		return { x: rectX + NODE_W, y: cy, nx: 1, ny: 0 }
	}

	const halfW = NODE_W / 2
	const halfH = nodeH / 2
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

export function pickEdgePoints(
	srcX: number,
	srcY: number,
	srcH: number,
	tgtX: number,
	tgtY: number,
	tgtH: number,
): WireEndpoints {
	const srcCenter = { x: srcX + NODE_W / 2, y: srcY + srcH / 2 }
	const tgtCenter = { x: tgtX + NODE_W / 2, y: tgtY + tgtH / 2 }

	const src = nearestEdgePoint(srcX, srcY, srcH, tgtCenter.x, tgtCenter.y)
	const tgt = nearestEdgePoint(tgtX, tgtY, tgtH, srcCenter.x, srcCenter.y)

	return { x1: src.x, y1: src.y, x2: tgt.x, y2: tgt.y, nx1: src.nx, ny1: src.ny, nx2: tgt.nx, ny2: tgt.ny }
}

/** A wire's look, drawn by `MindmapWireCanvas` */
export type WirePaint = {
	endpoints: WireEndpoints
	hasSourceArrow: boolean
	hasTargetArrow: boolean
	sourceColor: string
	midColor: string
	targetColor: string
	glowOpacity: number
	isActive: boolean
}

const wireRegistry = new Map<string, WireControlPoints>()

export const nodePositions = new Map<string, { x: number; y: number; height: number }>()

export function registerWire(id: string, ep: WireEndpoints): void {
	wireRegistry.set(id, toControlPoints(ep))
}

export function getWireMidpoint(id: string): { x: number; y: number } | null {
	const controlPoints = wireRegistry.get(id)
	return controlPoints ? midpointOf(controlPoints) : null
}

export function unregisterWire(id: string): void {
	wireRegistry.delete(id)
}

export function getWiresInRect(
	svgLeft: number,
	svgTop: number,
	svgRight: number,
	svgBottom: number,
): string[] {
	const result: string[] = []
	wireRegistry.forEach((cp, wireId) => {
		const bboxLeft = Math.min(cp.x1, cp.cx1, cp.cx2, cp.x2)
		const bboxRight = Math.max(cp.x1, cp.cx1, cp.cx2, cp.x2)
		const bboxTop = Math.min(cp.y1, cp.cy1, cp.cy2, cp.y2)
		const bboxBottom = Math.max(cp.y1, cp.cy1, cp.cy2, cp.y2)
		if (svgLeft > bboxRight || svgRight < bboxLeft || svgTop > bboxBottom || svgBottom < bboxTop) {
			return
		}
		const SAMPLES = 20
		for (let i = 0; i <= SAMPLES; i++) {
			const { x, y } = bezierPoint(cp, i / SAMPLES)
			if (x >= svgLeft && x <= svgRight && y >= svgTop && y <= svgBottom) {
				result.push(wireId)
				return
			}
		}
	})
	return result
}

export function buildPathD(ep: WireEndpoints) {
	const { x1, y1, cx1, cy1, cx2, cy2, x2, y2 } = toControlPoints(ep)
	return `M ${x1},${y1} C ${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`
}

export function pathMidpoint(ep: WireEndpoints): { x: number; y: number } {
	return midpointOf(toControlPoints(ep))
}
