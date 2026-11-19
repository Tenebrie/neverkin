import { beforeEach, describe, expect, it, rstest } from '@rstest/core'

import { MindmapWireBuffer, WIRE_ATTRIBUTES, WirePaint, WireSegment } from './MindmapWireBuffer'

const STRIDE = WIRE_ATTRIBUTES.reduce((total, attribute) => total + attribute.size, 0)

describe('MindmapWireBuffer', () => {
	beforeEach(() => {
		rstest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
	})

	it('lays a wire out as one record per segment, in order', () => {
		const buffer = new MindmapWireBuffer()

		buffer.publish('a', paintOf('a', 3))

		expect(buffer.segmentCount).toEqual(3)
		expect(layoutOf(buffer)).toEqual(['a0', 'a1', 'a2'])
	})

	it('keeps each wire in one run when a wire gains segments', () => {
		const buffer = new MindmapWireBuffer()
		buffer.publish('a', paintOf('a', 1))
		buffer.publish('b', paintOf('b', 1))

		buffer.publish('a', paintOf('a', 3))

		expect(layoutOf(buffer)).toEqual(['b0', 'a0', 'a1', 'a2'])
	})

	it('keeps two wires in the same order along their whole length after both change', () => {
		const buffer = new MindmapWireBuffer()
		buffer.publish('b', paintOf('b', 1))
		buffer.publish('a', paintOf('a', 1))

		buffer.publish('a', paintOf('a', 2))
		buffer.publish('b', paintOf('b', 2))

		const layout = layoutOf(buffer)
		const lastOfA = Math.max(...layout.map((key, slot) => (key.startsWith('a') ? slot : -1)))
		const firstOfB = Math.min(...layout.map((key, slot) => (key.startsWith('b') ? slot : Infinity)))
		expect(lastOfA).toBeLessThan(firstOfB)
	})

	it('overwrites a wire in place when its segment count is unchanged', () => {
		const buffer = new MindmapWireBuffer()
		buffer.publish('a', paintOf('a', 2))
		buffer.publish('b', paintOf('b', 1))

		buffer.publish('a', paintOf('a', 2))

		expect(layoutOf(buffer)).toEqual(['a0', 'a1', 'b0'])
	})

	it('drops the extra records when a wire shrinks', () => {
		const buffer = new MindmapWireBuffer()
		buffer.publish('a', paintOf('a', 3))

		buffer.publish('a', paintOf('a', 1))

		expect(layoutOf(buffer)).toEqual(['a0'])
	})

	it('drops every record of a removed wire', () => {
		const buffer = new MindmapWireBuffer()
		buffer.publish('a', paintOf('a', 2))
		buffer.publish('b', paintOf('b', 1))

		buffer.remove('a')

		expect(layoutOf(buffer)).toEqual(['b0'])
	})
})

/** A paint whose segments can be told apart in the GPU data: wire letter as x, segment index as y */
function paintOf(wireId: string, segmentCount: number): WirePaint {
	const segments: WireSegment[] = []
	for (let index = 0; index < segmentCount; index++) {
		const x = wireId.charCodeAt(0)
		segments.push({
			endpoints: { x1: x, y1: index, x2: x, y2: index, nx1: 1, ny1: 0, nx2: 1, ny2: 0 },
			curve: { x1: x, y1: index, cx1: x, cy1: index, cx2: x, cy2: index, x2: x, y2: index },
			progressStart: 0,
			progressEnd: 1,
		})
	}
	return {
		segments,
		hasSourceArrow: false,
		hasTargetArrow: true,
		sourceColor: 'red',
		midColor: 'red',
		targetColor: 'red',
		glowOpacity: 0.12,
		isActive: false,
	}
}

/** The wire letter and segment index of every record, in draw order */
function layoutOf(buffer: MindmapWireBuffer) {
	const { data } = buffer.takeChanges()
	const keys: string[] = []
	for (let slot = 0; slot < buffer.segmentCount; slot++) {
		const x = data[slot * STRIDE]
		const y = data[slot * STRIDE + 1]
		keys.push(`${String.fromCharCode(x)}${y}`)
	}
	return keys
}
