/** The parts every wire is drawn from. The vertex shader receives these as constants under the same names. */
export const WIRE_PIECES = {
	PIECE_GLOW: 0,
	PIECE_STROKE: 1,
	PIECE_PORT: 2,
	PIECE_BARB_LEFT: 3,
	PIECE_BARB_RIGHT: 4,
	PIECE_ARROW_TIP: 5,
}

/** Per-vertex inputs of the vertex shader, in the order `drawVertex` lays them out */
export const TEMPLATE_ATTRIBUTES = [
	{ name: 'a_piece', size: 1 },
	{ name: 'a_atTarget', size: 1 },
	{ name: 'a_along', size: 1 },
	{ name: 'a_side', size: 1 },
	{ name: 'a_corner', size: 2 },
]

export const TEMPLATE_STRIDE = TEMPLATE_ATTRIBUTES.reduce((total, attribute) => total + attribute.size, 0)

/** Each wire is cut into this many straight segments, whatever its length */
const SEGMENTS = 48

/**
 * The triangles of one wire, shared by every wire. Vertices only say which piece they belong to and where on
 * it they sit; the vertex shader places them using the wire's own ends, handles and colors.
 * Both arrowheads and both ports are always present, and the shader hides whichever ones the wire does not show.
 */
export function buildWireTemplate(): Float32Array {
	const out: number[] = []
	drawStrip(out, WIRE_PIECES.PIECE_GLOW)
	drawStrip(out, WIRE_PIECES.PIECE_STROKE)
	for (const atTarget of [0, 1]) {
		drawDisc(out, WIRE_PIECES.PIECE_PORT, atTarget)
		drawSegment(out, WIRE_PIECES.PIECE_BARB_LEFT, atTarget, 0, 1)
		drawSegment(out, WIRE_PIECES.PIECE_BARB_RIGHT, atTarget, 0, 1)
		drawDisc(out, WIRE_PIECES.PIECE_ARROW_TIP, atTarget)
	}
	return new Float32Array(out)
}

function drawStrip(out: number[], piece: number) {
	for (let i = 0; i < SEGMENTS; i++) {
		drawSegment(out, piece, 0, i / SEGMENTS, (i + 1) / SEGMENTS)
	}
}

/** Two triangles spanning from `from` to `to`, each end pushed out to both sides */
function drawSegment(out: number[], piece: number, atTarget: number, from: number, to: number) {
	drawVertex(out, piece, atTarget, from, 1, 0, 0)
	drawVertex(out, piece, atTarget, from, -1, 0, 0)
	drawVertex(out, piece, atTarget, to, 1, 0, 0)
	drawVertex(out, piece, atTarget, to, 1, 0, 0)
	drawVertex(out, piece, atTarget, from, -1, 0, 0)
	drawVertex(out, piece, atTarget, to, -1, 0, 0)
}

/** A square around the piece's center; the fragment shader cuts the circle out of it */
function drawDisc(out: number[], piece: number, atTarget: number) {
	const corners = [
		{ x: -1, y: -1 },
		{ x: 1, y: -1 },
		{ x: 1, y: 1 },
		{ x: -1, y: 1 },
	]
	for (const index of [0, 1, 2, 0, 2, 3]) {
		drawVertex(out, piece, atTarget, 0, 0, corners[index].x, corners[index].y)
	}
}

function drawVertex(
	out: number[],
	piece: number,
	atTarget: number,
	along: number,
	side: number,
	cornerX: number,
	cornerY: number,
) {
	out.push(piece, atTarget, along, side, cornerX, cornerY)
}
