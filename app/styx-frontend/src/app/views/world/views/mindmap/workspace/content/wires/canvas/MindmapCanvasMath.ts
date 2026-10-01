import type { WireEndpoints } from '../../../../unrefactored/mindmapWireUtils'

/**
 * A wire as a cubic Bézier curve, in grid coordinates.
 * The curve starts at (x1, y1) and ends at (x2, y2). It leaves the start heading towards (cx1, cy1)
 * and arrives at the end coming from (cx2, cy2); it does not pass through the two control points.
 */
export type WireControlPoints = {
	x1: number
	y1: number
	cx1: number
	cy1: number
	cx2: number
	cy2: number
	x2: number
	y2: number
}

/**
 * Turns a wire's attachment points into its curve.
 * Each control point sits out along its node's edge normal, so the wire leaves and enters its nodes
 * straight out of the edge. The further apart the nodes, the further out the control points reach.
 *
 * @param ep Start and end of the wire on the node edges, with each edge's outward unit normal (nx, ny).
 */
export function toControlPoints(ep: WireEndpoints): WireControlPoints {
	const bias = computeBias(ep)
	return {
		x1: ep.x1,
		y1: ep.y1,
		cx1: ep.x1 + ep.nx1 * bias,
		cy1: ep.y1 + ep.ny1 * bias,
		cx2: ep.x2 + ep.nx2 * bias,
		cy2: ep.y2 + ep.ny2 * bias,
		x2: ep.x2,
		y2: ep.y2,
	}
}

/**
 * The point on the curve at `t`.
 *
 * @param cp The curve.
 * @param t Position along the curve, from 0 (start) to 1 (end). Not proportional to distance travelled:
 * equal steps of `t` can cover different lengths of the curve.
 */
export function bezierPoint(cp: WireControlPoints, t: number): { x: number; y: number } {
	const mt = 1 - t
	return {
		x: mt * mt * mt * cp.x1 + 3 * mt * mt * t * cp.cx1 + 3 * mt * t * t * cp.cx2 + t * t * t * cp.x2,
		y: mt * mt * mt * cp.y1 + 3 * mt * mt * t * cp.cy1 + 3 * mt * t * t * cp.cy2 + t * t * t * cp.y2,
	}
}

/**
 * The point on the curve at t = 0.5, where wire labels sit.
 * Same result as `bezierPoint(cp, 0.5)`, with the weights worked out: (P0 + 3·P1 + 3·P2 + P3) / 8.
 *
 * @param cp The curve.
 */
export function midpointOf(cp: WireControlPoints): { x: number; y: number } {
	return {
		x: (cp.x1 + 3 * cp.cx1 + 3 * cp.cx2 + cp.x2) / 8,
		y: (cp.y1 + 3 * cp.cy1 + 3 * cp.cy2 + cp.y2) / 8,
	}
}

/**
 * The two outer ends of an arrowhead's barbs. Each barb is drawn as a line from its end to the tip.
 * The barbs reach `size` back from the tip and spread 0.4 × `size` to either side.
 *
 * @param x Tip of the arrow.
 * @param y Tip of the arrow.
 * @param nx The direction the arrow points in, as a unit vector (the way the wire travels at the tip).
 * @param ny The direction the arrow points in, as a unit vector (the way the wire travels at the tip).
 * @param size Length of the arrowhead, in grid units.
 */
export function arrowBarbs(x: number, y: number, nx: number, ny: number, size: number) {
	const px = -ny
	const py = nx
	return [
		{ x: x - nx * size + px * size * 0.4, y: y - ny * size + py * size * 0.4 },
		{ x: x - nx * size - px * size * 0.4, y: y - ny * size - py * size * 0.4 },
	]
}

/**
 * How far each control point reaches out from its node: 40% of the straight-line distance between the
 * wire's ends, capped at 400. Two facing handles then never overlap, so short wires flatten into a line.
 */
function computeBias(ep: WireEndpoints) {
	const dist = Math.hypot(ep.x2 - ep.x1, ep.y2 - ep.y1)
	return Math.min(dist * 0.4, 400)
}
