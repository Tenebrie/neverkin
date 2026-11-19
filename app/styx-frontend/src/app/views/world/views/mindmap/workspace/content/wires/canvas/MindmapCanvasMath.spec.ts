import { describe, expect, it } from '@rstest/core'

import {
	bezierPoint,
	nearestWirePoint,
	Point,
	toControlPoints,
	toWireSegments,
	WireControlPoints,
} from './MindmapCanvasMath'
import { WireEndpoints, WireSegment } from './MindmapWireBuffer'

/** Source edge on the right side of a node at the origin, target edge on the bottom of a node up and to the right */
const edges: WireEndpoints = { x1: 0, y1: 0, nx1: 1, ny1: 0, x2: 900, y2: -500, nx2: 0, ny2: 1 }
const waypoints: Point[] = [
	{ x: 300, y: 150 },
	{ x: 600, y: -300 },
]

describe('toWireSegments', () => {
	it('draws a wire without waypoints as the plain cubic between its edges', () => {
		const [segment, ...rest] = toWireSegments(edges, [])

		expect(rest).toHaveLength(0)
		expect(segment.curve).toEqual(toControlPoints(edges))
	})

	it('makes one curve per stretch between consecutive anchors', () => {
		const segments = toWireSegments(edges, waypoints)

		expect(segments.map((segment) => [segment.curve.x1, segment.curve.y1])).toEqual([
			[0, 0],
			[300, 150],
			[600, -300],
		])
		expect(segments.map((segment) => [segment.curve.x2, segment.curve.y2])).toEqual([
			[300, 150],
			[600, -300],
			[900, -500],
		])
	})

	it('leaves and enters the nodes straight out of their edges', () => {
		const [first, , last] = toWireSegments(edges, waypoints)

		expect(headingAtStart(first.curve)).toEqual({ x: 1, y: 0 })
		expect(headingAtEnd(last.curve)).toEqual({ x: 0, y: -1 })
	})

	it('passes through every waypoint without a kink', () => {
		const [first, second, third] = toWireSegments(edges, waypoints)

		expect(headingAtEnd(first.curve)).toEqual(headingAtStart(second.curve))
		expect(headingAtEnd(second.curve)).toEqual(headingAtStart(third.curve))
	})

	it('tiles the progress along the wire from 0 to 1', () => {
		const segments = toWireSegments(edges, waypoints)

		expect(segments[0].progressStart).toEqual(0)
		expect(segments[segments.length - 1].progressEnd).toEqual(1)
		for (let i = 1; i < segments.length; i++) {
			expect(segments[i].progressStart).toEqual(segments[i - 1].progressEnd)
			expect(segments[i].progressEnd).toBeGreaterThan(segments[i].progressStart)
		}
	})

	it('bends the wire by at most a few pixels when a waypoint is added on the wire itself', () => {
		const before = toWireSegments(edges, waypoints)
		const onTheWire = bezierPoint(before[1].curve, 0.5)

		const after = toWireSegments(edges, [waypoints[0], onTheWire, waypoints[1]])

		expect(maxDeviation(before, after)).toBeLessThan(15)
	})

	it('stays finite when anchors coincide', () => {
		const onTheEdge: Point = { x: edges.x1, y: edges.y1 }
		const segments = toWireSegments(edges, [onTheEdge, waypoints[0], waypoints[0]])

		for (const { curve } of segments) {
			for (const value of Object.values(curve)) {
				expect(Number.isFinite(value)).toBe(true)
			}
		}
	})
})

describe('nearestWirePoint', () => {
	it('finds which curve a point is next to, and the closest spot on that curve', () => {
		const segments = toWireSegments(edges, waypoints)
		const onSecondCurve = bezierPoint(segments[1].curve, 0.3)
		const nearby: Point = { x: onSecondCurve.x + 6, y: onSecondCurve.y - 6 }

		const nearest = nearestWirePoint(
			segments.map((segment) => segment.curve),
			nearby,
		)

		expect(nearest.index).toEqual(1)
		expect(distanceToCurve(nearest.point, segments[1].curve)).toBeLessThan(1)
		expect(distance(nearest.point, nearby)).toBeLessThanOrEqual(distance(onSecondCurve, nearby))
	})
})

function headingAtStart(curve: WireControlPoints) {
	return unit({ x: curve.cx1 - curve.x1, y: curve.cy1 - curve.y1 })
}

function headingAtEnd(curve: WireControlPoints) {
	return unit({ x: curve.x2 - curve.cx2, y: curve.y2 - curve.cy2 })
}

function unit(vector: Point): Point {
	const length = Math.hypot(vector.x, vector.y)
	return { x: round(vector.x / length), y: round(vector.y / length) }
}

function round(value: number) {
	return Math.round(value * 1000) / 1000
}

function distance(a: Point, b: Point) {
	return Math.hypot(a.x - b.x, a.y - b.y)
}

function distanceToCurve(point: Point, curve: WireControlPoints) {
	let nearest = Infinity
	for (let step = 0; step <= 2000; step++) {
		nearest = Math.min(nearest, distance(point, bezierPoint(curve, step / 2000)))
	}
	return nearest
}

/** How far any point of `after` is from the closest point of `before`, both sampled densely */
function maxDeviation(before: WireSegment[], after: WireSegment[]) {
	const reference = before.flatMap((segment) => sample(segment.curve))
	let worst = 0
	for (const point of after.flatMap((segment) => sample(segment.curve))) {
		let nearest = Infinity
		for (const candidate of reference) {
			nearest = Math.min(nearest, distance(point, candidate))
		}
		worst = Math.max(worst, nearest)
	}
	return worst
}

function sample(curve: WireControlPoints) {
	const points: Point[] = []
	for (let step = 0; step <= 100; step++) {
		points.push(bezierPoint(curve, step / 100))
	}
	return points
}
