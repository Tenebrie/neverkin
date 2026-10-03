import { useLayoutEffect, useRef } from 'react'

import { useMindmapContext } from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { MindmapState } from '@/app/views/world/views/mindmap/MindmapState'

import { buildWireTemplate, TEMPLATE_ATTRIBUTES, TEMPLATE_STRIDE, WIRE_PIECES } from './MindmapCanvasTemplate'
import { WIRE_ATTRIBUTES } from './MindmapWireBuffer'
import FRAGMENT_SHADER from './shaders/MindmapCanvas.glsl.frag?raw'
import VERTEX_SHADER from './shaders/MindmapCanvas.glsl.vert?raw'

export const GLOW_WIDTH = 8
const STROKE_WIDTH = 2
/** The former SVG port: an r=3 circle with a 2px stroke */
const PORT_RADIUS = 4
const ARROW_SIZE = 8

type ShaderAttribute = { name: string; size: number }

/**
 * Draws every wire with one instanced draw call. The triangles of a single wire are uploaded once and shared;
 * each wire only contributes its ends, handles, colors and style, and only the wires that changed are uploaded.
 */
export function MindmapWireCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const { wireBuffer } = useMindmapContext()

	useLayoutEffect(() => {
		const canvas = canvasRef.current
		const gl = canvas?.getContext('webgl2', { antialias: false, premultipliedAlpha: true })
		const program = gl ? createProgram(gl) : null
		if (!canvas || !gl || !program) {
			return
		}

		gl.useProgram(program)
		const template = buildWireTemplate()
		const templateVertexCount = template.length / TEMPLATE_STRIDE
		const templateGlBuffer = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, templateGlBuffer)
		gl.bufferData(gl.ARRAY_BUFFER, template, gl.STATIC_DRAW)
		bindAttributes(gl, program, TEMPLATE_ATTRIBUTES, 0)

		const wireGlBuffer = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, wireGlBuffer)
		bindAttributes(gl, program, WIRE_ATTRIBUTES, 1)

		gl.enable(gl.BLEND)
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
		const scaleLocation = gl.getUniformLocation(program, 'u_scale')
		const cameraLocation = gl.getUniformLocation(program, 'u_camera')
		const viewportLocation = gl.getUniformLocation(program, 'u_viewport')

		let width = 0
		let height = 0
		let uploadedLength = 0

		wireBuffer.setPainter(() => {
			const { data, offset, length } = wireBuffer.takeChanges()
			if (data.length !== uploadedLength) {
				gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)
				uploadedLength = data.length
			} else if (length > 0) {
				gl.bufferSubData(gl.ARRAY_BUFFER, offset * Float32Array.BYTES_PER_ELEMENT, data, offset, length)
			}
			gl.viewport(0, 0, canvas.width, canvas.height)
			gl.clearColor(0, 0, 0, 0)
			gl.clear(gl.COLOR_BUFFER_BIT)
			gl.uniform1f(scaleLocation, MindmapState.scale)
			gl.uniform2f(cameraLocation, MindmapState.cameraX, MindmapState.cameraY)
			gl.uniform2f(viewportLocation, width, height)
			gl.drawArraysInstanced(gl.TRIANGLES, 0, templateVertexCount, wireBuffer.wireCount)
		})

		const resizeObserver = new ResizeObserver(() => {
			width = canvas.clientWidth
			height = canvas.clientHeight
			canvas.width = width * window.devicePixelRatio
			canvas.height = height * window.devicePixelRatio
			wireBuffer.requestPaint()
		})
		resizeObserver.observe(canvas)

		return () => {
			wireBuffer.setPainter(null)
			resizeObserver.disconnect()
			gl.deleteBuffer(templateGlBuffer)
			gl.deleteBuffer(wireGlBuffer)
			gl.deleteProgram(program)
		}
	}, [wireBuffer])

	return (
		<canvas
			ref={canvasRef}
			style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}
		/>
	)
}

function createProgram(gl: WebGL2RenderingContext) {
	const program = gl.createProgram()
	const vertexShader = compileShader(
		gl,
		gl.VERTEX_SHADER,
		shaderDefines({
			...WIRE_PIECES,
			GLOW_RADIUS: GLOW_WIDTH / 2,
			STROKE_RADIUS: STROKE_WIDTH / 2,
			PORT_RADIUS,
			ARROW_SIZE,
		}) + VERTEX_SHADER,
	)
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

function shaderDefines(constants: Record<string, number>) {
	return Object.entries(constants)
		.map(([name, value]) => `#define ${name} ${Number.isInteger(value) ? value.toFixed(1) : value}\n`)
		.join('')
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
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

/** Lays `attributes` out back to back in the bound buffer; a divisor of 1 advances them once per wire */
function bindAttributes(
	gl: WebGL2RenderingContext,
	program: WebGLProgram,
	attributes: ShaderAttribute[],
	divisor: number,
) {
	const stride = attributes.reduce((total, attribute) => total + attribute.size, 0)
	let offset = 0
	for (const { name, size } of attributes) {
		const location = gl.getAttribLocation(program, name)
		gl.enableVertexAttribArray(location)
		gl.vertexAttribPointer(
			location,
			size,
			gl.FLOAT,
			false,
			stride * Float32Array.BYTES_PER_ELEMENT,
			offset * Float32Array.BYTES_PER_ELEMENT,
		)
		gl.vertexAttribDivisor(location, divisor)
		offset += size
	}
}
