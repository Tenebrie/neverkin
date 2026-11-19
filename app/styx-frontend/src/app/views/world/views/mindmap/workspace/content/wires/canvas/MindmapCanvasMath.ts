import { WireEndpoints, WireSegment } from './MindmapWireBuffer'

export type Point = { x: number; y: number }

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
	const bias = computeBias(Math.hypot(ep.x2 - ep.x1, ep.y2 - ep.y1))
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

/** Splits the wire into curves through the given waypoints, as one smooth spline from edge to edge */
export function toWireSegments(ep: WireEndpoints, waypoints: Point[]): WireSegment[] {
	const anchors: Point[] = [{ x: ep.x1, y: ep.y1 }, ...waypoints, { x: ep.x2, y: ep.y2 }]
	const chordLengths: number[] = []
	for (let i = 1; i < anchors.length; i++) {
		chordLengths.push(Math.hypot(anchors[i].x - anchors[i - 1].x, anchors[i].y - anchors[i - 1].y) || 1)
	}
	const totalLength = chordLengths.reduce((sum, length) => sum + length, 0)
	const edgeSlope = (3 * computeBias(totalLength)) / totalLength
	const tangents = solveSplineTangents(anchors, chordLengths, {
		start: { x: ep.nx1 * edgeSlope, y: ep.ny1 * edgeSlope },
		end: { x: -ep.nx2 * edgeSlope, y: -ep.ny2 * edgeSlope },
	})

	const segments: WireSegment[] = []
	let travelled = 0
	for (let i = 0; i < chordLengths.length; i++) {
		const start = anchors[i]
		const end = anchors[i + 1]
		const chordLength = chordLengths[i]
		const startNormal = i === 0 ? { x: ep.nx1, y: ep.ny1 } : unit(tangents[i])
		const endNormal = i === chordLengths.length - 1 ? { x: ep.nx2, y: ep.ny2 } : unit(tangents[i + 1])
		const progressStart = travelled / totalLength
		travelled += chordLength
		segments.push({
			endpoints: {
				x1: start.x,
				y1: start.y,
				x2: end.x,
				y2: end.y,
				nx1: startNormal.x,
				ny1: startNormal.y,
				nx2: endNormal.x,
				ny2: endNormal.y,
			},
			curve: {
				x1: start.x,
				y1: start.y,
				cx1: start.x + (tangents[i].x * chordLength) / 3,
				cy1: start.y + (tangents[i].y * chordLength) / 3,
				cx2: end.x - (tangents[i + 1].x * chordLength) / 3,
				cy2: end.y - (tangents[i + 1].y * chordLength) / 3,
				x2: end.x,
				y2: end.y,
			},
			progressStart,
			progressEnd: travelled / totalLength,
		})
	}
	return segments
}

/** The closest point on the wire, and which of its curves it lies on */
export function nearestWirePoint(curves: WireControlPoints[], point: Point): { index: number; point: Point } {
	const SAMPLES = 32
	let nearest = { index: 0, point }
	let nearestDistance = Infinity
	for (let index = 0; index < curves.length; index++) {
		for (let step = 0; step <= SAMPLES; step++) {
			const sample = bezierPoint(curves[index], step / SAMPLES)
			const distance = Math.hypot(sample.x - point.x, sample.y - point.y)
			if (distance < nearestDistance) {
				nearestDistance = distance
				nearest = { index, point: sample }
			}
		}
	}
	return nearest
}

/** Where a wire's label sits: the middle of its middle curve */
export function wireMidpoint(curves: WireControlPoints[]): Point {
	return midpointOf(curves[Math.floor(curves.length / 2)])
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
 * How far each control point reaches out from its node: 40% of the wire's length, capped at 400.
 * Two facing handles then never overlap, so short wires flatten into a line.
 */
function computeBias(wireLength: number) {
	return Math.min(wireLength * 0.4, 400)
}

/** Tangent at every anchor of the spline through them, given the tangents at both ends */
function solveSplineTangents(
	anchors: Point[],
	chordLengths: number[],
	ends: { start: Point; end: Point },
): Point[] {
	const last = anchors.length - 1
	const tangents: Point[] = new Array(last + 1)
	tangents[0] = ends.start
	tangents[last] = ends.end
	if (last < 2) {
		return tangents
	}

	const lower: number[] = []
	const diagonal: number[] = []
	const upper: number[] = []
	const rhs: Point[] = []
	for (let i = 1; i < last; i++) {
		const before = chordLengths[i - 1]
		const after = chordLengths[i]
		lower.push(after)
		diagonal.push(2 * (before + after))
		upper.push(before)
		const slopeBefore = {
			x: (anchors[i].x - anchors[i - 1].x) / before,
			y: (anchors[i].y - anchors[i - 1].y) / before,
		}
		const slopeAfter = {
			x: (anchors[i + 1].x - anchors[i].x) / after,
			y: (anchors[i + 1].y - anchors[i].y) / after,
		}
		rhs.push({
			x: 3 * (after * slopeBefore.x + before * slopeAfter.x),
			y: 3 * (after * slopeBefore.y + before * slopeAfter.y),
		})
	}
	rhs[0].x -= lower[0] * ends.start.x
	rhs[0].y -= lower[0] * ends.start.y
	rhs[last - 2].x -= upper[last - 2] * ends.end.x
	rhs[last - 2].y -= upper[last - 2] * ends.end.y

	for (let i = 1; i < last - 1; i++) {
		const factor = lower[i] / diagonal[i - 1]
		diagonal[i] -= factor * upper[i - 1]
		rhs[i].x -= factor * rhs[i - 1].x
		rhs[i].y -= factor * rhs[i - 1].y
	}
	tangents[last - 1] = { x: rhs[last - 2].x / diagonal[last - 2], y: rhs[last - 2].y / diagonal[last - 2] }
	for (let i = last - 2; i >= 1; i--) {
		tangents[i] = {
			x: (rhs[i - 1].x - upper[i - 1] * tangents[i + 1].x) / diagonal[i - 1],
			y: (rhs[i - 1].y - upper[i - 1] * tangents[i + 1].y) / diagonal[i - 1],
		}
	}
	return tangents
}

function unit(vector: Point): Point {
	const length = Math.hypot(vector.x, vector.y) || 1
	return { x: vector.x / length, y: vector.y / length }
}
