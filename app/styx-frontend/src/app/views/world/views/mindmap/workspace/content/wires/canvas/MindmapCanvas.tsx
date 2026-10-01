import { useLayoutEffect, useRef } from 'react'

import { MindmapState } from '../../../../MindmapState'
import {
	requestWirePaint,
	setWirePainter,
	WirePaint,
	wirePaints,
} from '../../../../unrefactored/mindmapWireUtils'
import { arrowBarbs, bezierPoint, toControlPoints } from './MindmapCanvasMath'
import FRAGMENT_SHADER from './shaders/MindmapCanvas.glsl.frag?raw'
import VERTEX_SHADER from './shaders/MindmapCanvas.glsl.vert?raw'

const GLOW_WIDTH = 8
const STROKE_WIDTH = 2
/** The former SVG port: an r=3 circle with a 2px stroke */
const PORT_RADIUS = 4
const ARROW_SIZE = 8
/** Grid units per curve segment; long wires get more segments, within the clamp */
const SEGMENT_LENGTH = 12

/** Floats per vertex: center (2), offset (2), radius (1), color (4) */
const STRIDE = 9

type Point = { x: number; y: number }
type Rgba = [number, number, number, number]
type StripVertex = { point: Point; normal: Point; color: Rgba }

export function MindmapWireCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useLayoutEffect(() => {
		const canvas = canvasRef.current
		const gl = canvas?.getContext('webgl', { antialias: false, premultipliedAlpha: true })
		const program = gl ? createProgram(gl) : null
		if (!canvas || !gl || !program) {
			return
		}

		gl.useProgram(program)
		const buffer = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
		bindAttribute(gl, program, 'a_center', 2, 0)
		bindAttribute(gl, program, 'a_offset', 2, 2)
		bindAttribute(gl, program, 'a_radius', 1, 4)
		bindAttribute(gl, program, 'a_color', 4, 5)
		gl.enable(gl.BLEND)
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
		const scaleLocation = gl.getUniformLocation(program, 'u_scale')
		const cameraLocation = gl.getUniformLocation(program, 'u_camera')
		const viewportLocation = gl.getUniformLocation(program, 'u_viewport')

		let width = 0
		let height = 0
		let vertexCount = 0
		let uploadedWireCount = 0

		setWirePainter(() => {
			let changed = wirePaints.size !== uploadedWireCount
			const chunks: Float32Array[] = []
			for (const paint of wirePaints.values()) {
				if (!paint.vertices) {
					paint.vertices = buildWireVertices(paint)
					changed = true
				}
				chunks.push(paint.vertices)
			}
			if (changed) {
				const vertices = concat(chunks)
				gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW)
				vertexCount = vertices.length / STRIDE
				uploadedWireCount = wirePaints.size
			}

			gl.viewport(0, 0, canvas.width, canvas.height)
			gl.clearColor(0, 0, 0, 0)
			gl.clear(gl.COLOR_BUFFER_BIT)
			gl.uniform1f(scaleLocation, MindmapState.scale)
			gl.uniform2f(cameraLocation, MindmapState.cameraX, MindmapState.cameraY)
			gl.uniform2f(viewportLocation, width, height)
			gl.drawArrays(gl.TRIANGLES, 0, vertexCount)
		})

		const resizeObserver = new ResizeObserver(() => {
			width = canvas.clientWidth
			height = canvas.clientHeight
			canvas.width = width * window.devicePixelRatio
			canvas.height = height * window.devicePixelRatio
			requestWirePaint()
		})
		resizeObserver.observe(canvas)

		return () => {
			setWirePainter(null)
			resizeObserver.disconnect()
			gl.deleteBuffer(buffer)
			gl.deleteProgram(program)
		}
	}, [])

	return (
		<canvas
			ref={canvasRef}
			style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}
		/>
	)
}

function buildWireVertices(paint: WirePaint): Float32Array {
	const out: number[] = []
	const ep = paint.endpoints
	const points = sampleCurve(ep)
	const gradientAt = createGradient(paint)
	const shade = paint.isActive ? 0.85 : 1
	const strokeAt = (point: Point) => shaded(gradientAt(point), shade)

	const edges = { start: { x: -ep.ny1, y: ep.nx1 }, end: { x: -ep.ny2, y: ep.nx2 } }
	drawStrip(out, points, edges, GLOW_WIDTH / 2, (point) => faded(gradientAt(point), paint.glowOpacity))
	drawStrip(out, points, edges, STROKE_WIDTH / 2, strokeAt)

	const source = points[0]
	const target = points[points.length - 1]
	if (paint.hasSourceArrow) {
		drawArrow(out, source, directionBetween(points[1], source), strokeAt(source))
	} else {
		drawDisc(out, source, PORT_RADIUS, strokeAt(source))
	}
	if (paint.hasTargetArrow) {
		drawArrow(out, target, directionBetween(points[points.length - 2], target), strokeAt(target))
	} else {
		drawDisc(out, target, PORT_RADIUS, strokeAt(target))
	}
	return new Float32Array(out)
}

function sampleCurve(ep: WirePaint['endpoints']): Point[] {
	const cp = toControlPoints(ep)
	const hullLength =
		Math.hypot(cp.cx1 - cp.x1, cp.cy1 - cp.y1) +
		Math.hypot(cp.cx2 - cp.cx1, cp.cy2 - cp.cy1) +
		Math.hypot(cp.x2 - cp.cx2, cp.y2 - cp.cy2)
	const segments = Math.min(Math.max(Math.ceil(hullLength / SEGMENT_LENGTH), 6), 48)
	const points: Point[] = []
	for (let i = 0; i <= segments; i++) {
		points.push(bezierPoint(cp, i / segments))
	}
	return points
}

function createGradient(paint: WirePaint) {
	const source = resolveColor(paint.sourceColor)
	const mid = resolveColor(paint.midColor)
	const target = resolveColor(paint.targetColor)
	const { x1, y1, x2, y2 } = paint.endpoints
	const dx = x2 - x1
	const dy = y2 - y1
	const lengthSquared = dx * dx + dy * dy || 1

	return (point: Point): Rgba => {
		const t = Math.min(Math.max(((point.x - x1) * dx + (point.y - y1) * dy) / lengthSquared, 0), 1)
		if (t < 0.5) {
			return lerpColor(source, mid, t * 2)
		}
		return lerpColor(mid, target, t * 2 - 1)
	}
}

/** The ends are cut along the node edges rather than square to the last segment, so they sit flush */
function drawStrip(
	out: number[],
	points: Point[],
	edges: { start: Point; end: Point },
	radius: number,
	colorAt: (point: Point) => Rgba,
) {
	const vertices = points.map((point, i): StripVertex => {
		const previous = points[Math.max(i - 1, 0)]
		const next = points[Math.min(i + 1, points.length - 1)]
		const length = Math.hypot(next.x - previous.x, next.y - previous.y) || 1
		const normal = { x: -(next.y - previous.y) / length, y: (next.x - previous.x) / length }
		return { point, normal, color: colorAt(point) }
	})
	const first = vertices[0]
	const last = vertices[vertices.length - 1]
	first.normal = alignedWith(edges.start, first.normal)
	last.normal = alignedWith(edges.end, last.normal)
	for (let i = 0; i < vertices.length - 1; i++) {
		drawSegment(out, vertices[i], vertices[i + 1], radius)
	}
}

/** `edge`, flipped if needed to point the same way as `reference`, so the strip does not twist */
function alignedWith(edge: Point, reference: Point): Point {
	if (edge.x * reference.x + edge.y * reference.y < 0) {
		return { x: -edge.x, y: -edge.y }
	}
	return edge
}

function directionBetween(from: Point, to: Point): Point {
	const length = Math.hypot(to.x - from.x, to.y - from.y) || 1
	return { x: (to.x - from.x) / length, y: (to.y - from.y) / length }
}

function drawArrow(out: number[], tip: Point, direction: Point, color: Rgba) {
	for (const barb of arrowBarbs(tip.x, tip.y, direction.x, direction.y, ARROW_SIZE)) {
		const length = Math.hypot(tip.x - barb.x, tip.y - barb.y)
		const normal = { x: -(tip.y - barb.y) / length, y: (tip.x - barb.x) / length }
		drawSegment(out, { point: barb, normal, color }, { point: tip, normal, color }, STROKE_WIDTH / 2)
	}
	drawDisc(out, tip, STROKE_WIDTH / 2, color)
}

/** Two triangles spanning from `a` to `b`, each end pushed out both ways along its normal */
function drawSegment(out: number[], a: StripVertex, b: StripVertex, radius: number) {
	const aBack = { x: -a.normal.x, y: -a.normal.y }
	const bBack = { x: -b.normal.x, y: -b.normal.y }
	drawVertex(out, a.point, a.normal, radius, a.color)
	drawVertex(out, a.point, aBack, radius, a.color)
	drawVertex(out, b.point, b.normal, radius, b.color)
	drawVertex(out, b.point, b.normal, radius, b.color)
	drawVertex(out, a.point, aBack, radius, a.color)
	drawVertex(out, b.point, bBack, radius, b.color)
}

/** A square around `center`; the fragment shader cuts the circle out of it */
function drawDisc(out: number[], center: Point, radius: number, color: Rgba) {
	const corners = [
		{ x: -1, y: -1 },
		{ x: 1, y: -1 },
		{ x: 1, y: 1 },
		{ x: -1, y: 1 },
	]
	for (const index of [0, 1, 2, 0, 2, 3]) {
		drawVertex(out, center, corners[index], radius, color)
	}
}

function drawVertex(out: number[], center: Point, offset: Point, radius: number, color: Rgba) {
	out.push(center.x, center.y, offset.x, offset.y, radius, color[0], color[1], color[2], color[3])
}

function lerpColor(a: Rgba, b: Rgba, t: number): Rgba {
	return [
		a[0] + (b[0] - a[0]) * t,
		a[1] + (b[1] - a[1]) * t,
		a[2] + (b[2] - a[2]) * t,
		a[3] + (b[3] - a[3]) * t,
	]
}

function shaded(color: Rgba, factor: number): Rgba {
	return [color[0] * factor, color[1] * factor, color[2] * factor, color[3]]
}

function faded(color: Rgba, opacity: number): Rgba {
	return [color[0], color[1], color[2], color[3] * opacity]
}

function concat(chunks: Float32Array[]): Float32Array {
	let length = 0
	for (const chunk of chunks) {
		length += chunk.length
	}
	const result = new Float32Array(length)
	let offset = 0
	for (const chunk of chunks) {
		result.set(chunk, offset)
		offset += chunk.length
	}
	return result
}

const resolvedColors = new Map<string, Rgba>()
let colorProbe: CanvasRenderingContext2D | null = null

/** Any CSS color, `color-mix()` included, as straight RGBA in 0..1 */
function resolveColor(color: string): Rgba {
	const cached = resolvedColors.get(color)
	if (cached) {
		return cached
	}
	colorProbe ??= createColorProbe()
	if (!colorProbe) {
		return [0, 0, 0, 0]
	}
	colorProbe.clearRect(0, 0, 1, 1)
	colorProbe.fillStyle = color
	colorProbe.fillRect(0, 0, 1, 1)
	const [r, g, b, a] = colorProbe.getImageData(0, 0, 1, 1).data
	const rgba: Rgba = [r / 255, g / 255, b / 255, a / 255]
	resolvedColors.set(color, rgba)
	return rgba
}

function createColorProbe() {
	const canvas = document.createElement('canvas')
	canvas.width = 1
	canvas.height = 1
	return canvas.getContext('2d', { willReadFrequently: true })
}

function createProgram(gl: WebGLRenderingContext) {
	const program = gl.createProgram()
	const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
	const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
	if (!program || !vertexShader || !fragmentShader) {
		return null
	}
	gl.attachShader(program, vertexShader)
	gl.attachShader(program, fragmentShader)
	gl.linkProgram(program)
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(program))
		return null
	}
	return program
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
	const shader = gl.createShader(type)
	if (!shader) {
		return null
	}
	gl.shaderSource(shader, source)
	gl.compileShader(shader)
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(shader))
		return null
	}
	return shader
}

function bindAttribute(
	gl: WebGLRenderingContext,
	program: WebGLProgram,
	name: string,
	size: number,
	offset: number,
) {
	const location = gl.getAttribLocation(program, name)
	gl.enableVertexAttribArray(location)
	gl.vertexAttribPointer(location, size, gl.FLOAT, false, STRIDE * 4, offset * 4)
}
