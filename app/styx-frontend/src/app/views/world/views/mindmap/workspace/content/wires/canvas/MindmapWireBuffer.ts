import { SlotBuffer } from '@/app/features/rendering/SlotBuffer'

import { WireControlPoints } from './MindmapCanvasMath'

/** A wire's look, drawn by `MindmapWireCanvas` */
export type WirePaint = {
	segments: WireSegment[]
	hasSourceArrow: boolean
	hasTargetArrow: boolean
	sourceColor: string
	midColor: string
	targetColor: string
	glowOpacity: number
	isActive: boolean
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

/** One curve of a wire between two consecutive anchors, with its share of the wire from 0 to 1 */
export type WireSegment = {
	endpoints: WireEndpoints
	curve: WireControlPoints
	progressStart: number
	progressEnd: number
}

/** Per-wire inputs of the vertex shader, in the order `MindmapWireBuffer.encode` lays them out */
export const WIRE_ATTRIBUTES = [
	{ name: 'a_sourcePoint', size: 2 },
	{ name: 'a_sourceHandle', size: 2 },
	{ name: 'a_targetHandle', size: 2 },
	{ name: 'a_targetPoint', size: 2 },
	{ name: 'a_sourceEdge', size: 2 },
	{ name: 'a_targetEdge', size: 2 },
	{ name: 'a_sourceColor', size: 4 },
	{ name: 'a_midColor', size: 4 },
	{ name: 'a_targetColor', size: 4 },
	{ name: 'a_style', size: 4 },
	{ name: 'a_progress', size: 2 },
]

const WIRE_STRIDE = WIRE_ATTRIBUTES.reduce((total, attribute) => total + attribute.size, 0)
const ACTIVE_SHADE = 0.85

type Rgba = [number, number, number, number]

/**
 * Wire GPU buffer: every wire of one mindmap encoded for the vertex shader, one record per segment, drawn in
 * record order. Any change schedules a repaint of the canvas that draws it.
 */
export class MindmapWireBuffer {
	private readonly records = new SlotBuffer<string>(WIRE_STRIDE)
	private readonly segmentCounts = new Map<string, number>()
	/** Reused for every publish, so encoding a segment allocates nothing */
	private readonly encoded = new Float32Array(WIRE_STRIDE)
	private readonly resolvedColors = new Map<string, Rgba>()
	private colorProbe: CanvasRenderingContext2D | null = null
	private painter: (() => void) | null = null
	private pendingPaint = 0

	get segmentCount() {
		return this.records.count
	}

	/** Keeps a wire's segments together in the buffer, so overlapping wires layer consistently */
	publish(wireId: string, paint: WirePaint) {
		if (this.segmentCounts.get(wireId) !== paint.segments.length) {
			this.remove(wireId)
		}
		for (let index = 0; index < paint.segments.length; index++) {
			this.encode(paint, index)
			this.records.write(segmentKey(wireId, index), this.encoded)
		}
		this.segmentCounts.set(wireId, paint.segments.length)
		this.requestPaint()
	}

	remove(wireId: string) {
		const count = this.segmentCounts.get(wireId) ?? 0
		for (let index = 0; index < count; index++) {
			this.records.delete(segmentKey(wireId, index))
		}
		this.segmentCounts.delete(wireId)
		if (count > 0) {
			this.requestPaint()
		}
	}

	takeChanges() {
		return this.records.takeChanges()
	}

	setPainter(painter: (() => void) | null) {
		this.painter = painter
	}

	/** Coalesces every wire change and camera move within a frame into a single repaint */
	requestPaint() {
		if (this.pendingPaint) {
			return
		}
		this.pendingPaint = requestAnimationFrame(this.runPaint)
	}

	private readonly runPaint = () => {
		this.pendingPaint = 0
		this.painter?.()
	}

	/** Writes segment `index` of `paint` into `encoded`, in the order of `WIRE_ATTRIBUTES` */
	private encode(paint: WirePaint, index: number) {
		const out = this.encoded
		const { curve, endpoints, progressStart, progressEnd } = paint.segments[index]
		const { nx1, ny1, nx2, ny2 } = endpoints
		const isFirst = index === 0
		const isLast = index === paint.segments.length - 1
		let i = 0
		out[i++] = curve.x1
		out[i++] = curve.y1
		out[i++] = curve.cx1
		out[i++] = curve.cy1
		out[i++] = curve.cx2
		out[i++] = curve.cy2
		out[i++] = curve.x2
		out[i++] = curve.y2
		out[i++] = -ny1
		out[i++] = nx1
		out[i++] = -ny2
		out[i++] = nx2
		out.set(this.resolveColor(paint.sourceColor), i)
		i += 4
		out.set(this.resolveColor(paint.midColor), i)
		i += 4
		out.set(this.resolveColor(paint.targetColor), i)
		i += 4
		out[i++] = paint.glowOpacity
		out[i++] = paint.isActive ? ACTIVE_SHADE : 1
		out[i++] = paint.hasSourceArrow && isFirst ? 1 : 0
		out[i++] = paint.hasTargetArrow && isLast ? 1 : 0
		out[i++] = progressStart
		out[i++] = progressEnd
	}

	/** Any CSS color, `color-mix()` included, as straight RGBA in 0..1 */
	private resolveColor(color: string): Rgba {
		const cached = this.resolvedColors.get(color)
		if (cached) {
			return cached
		}
		this.colorProbe ??= createColorProbe()
		if (!this.colorProbe) {
			return [0, 0, 0, 0]
		}
		this.colorProbe.clearRect(0, 0, 1, 1)
		this.colorProbe.fillStyle = color
		this.colorProbe.fillRect(0, 0, 1, 1)
		const [r, g, b, a] = this.colorProbe.getImageData(0, 0, 1, 1).data
		const rgba: Rgba = [r / 255, g / 255, b / 255, a / 255]
		this.resolvedColors.set(color, rgba)
		return rgba
	}
}

function segmentKey(wireId: string, index: number) {
	return `${wireId}/${index}`
}

function createColorProbe() {
	const canvas = document.createElement('canvas')
	canvas.width = 1
	canvas.height = 1
	return canvas.getContext('2d', { willReadFrequently: true })
}
