// PIECE_*, GLOW_RADIUS, STROKE_RADIUS, PORT_RADIUS and ARROW_SIZE are prepended as #defines by MindmapCanvas.tsx

// Shared template: where this vertex sits on one wire
attribute float a_piece;
attribute float a_atTarget;
attribute float a_along;
attribute float a_side;
attribute vec2 a_corner;

// Per wire
attribute vec2 a_sourcePoint;
attribute vec2 a_sourceHandle;
attribute vec2 a_targetHandle;
attribute vec2 a_targetPoint;
attribute vec2 a_sourceEdge;
attribute vec2 a_targetEdge;
attribute vec4 a_sourceColor;
attribute vec4 a_midColor;
attribute vec4 a_targetColor;
/** Glow opacity, stroke shade, has source arrow, has target arrow */
attribute vec4 a_style;

uniform float u_scale;
uniform vec2 u_camera;
uniform vec2 u_viewport;
varying vec2 v_local;
varying float v_radius;
varying vec4 v_color;

/** The point `along` the wire, from 0 at the source to 1 at the target */
vec2 pointOnWire(float along) {
	float rest = 1.0 - along;
	return rest * rest * rest * a_sourcePoint
		+ 3.0 * rest * rest * along * a_sourceHandle
		+ 3.0 * rest * along * along * a_targetHandle
		+ along * along * along * a_targetPoint;
}

/** The direction the wire is travelling at `along`, as a unit vector */
vec2 headingOnWire(float along) {
	float rest = 1.0 - along;
	vec2 heading = rest * rest * (a_sourceHandle - a_sourcePoint)
		+ 2.0 * rest * along * (a_targetHandle - a_sourceHandle)
		+ along * along * (a_targetPoint - a_targetHandle);
	float headingLength = length(heading);
	return headingLength > 0.0 ? heading / headingLength : vec2(1.0, 0.0);
}

/** Source color at the source end, blending through the mid color into the target color at the target end */
vec4 colorAt(vec2 point) {
	vec2 span = a_targetPoint - a_sourcePoint;
	float spanLengthSquared = dot(span, span);
	float progress = clamp(dot(point - a_sourcePoint, span) / (spanLengthSquared > 0.0 ? spanLengthSquared : 1.0), 0.0, 1.0);
	if (progress < 0.5) {
		return mix(a_sourceColor, a_midColor, progress * 2.0);
	}
	return mix(a_midColor, a_targetColor, progress * 2.0 - 1.0);
}

vec4 strokeColorAt(vec2 point) {
	vec4 color = colorAt(point);
	return vec4(color.rgb * a_style.y, color.a);
}

/** `edge`, flipped if needed to point the same way as `reference`, so the strip does not twist */
vec2 alignedWith(vec2 edge, vec2 reference) {
	return dot(edge, reference) < 0.0 ? -edge : edge;
}

/**
 * The direction an arrowhead at `tip` points: the way the wire travels over its last stretch, about 12 grid units
 * but never less than a 48th or more than a sixth of the wire. On a short, bent wire the arrow then follows the
 * visible line rather than the node edge the wire ends on.
 */
vec2 arrowPointing(vec2 tip, bool atTarget) {
	float pathLength = length(a_sourceHandle - a_sourcePoint)
		+ length(a_targetHandle - a_sourceHandle)
		+ length(a_targetPoint - a_targetHandle);
	float stepBack = 1.0 / clamp(ceil(pathLength / 12.0), 6.0, 48.0);
	vec2 pointing = tip - pointOnWire(atTarget ? 1.0 - stepBack : stepBack);
	float pointingLength = length(pointing);
	return pointingLength > 0.0 ? pointing / pointingLength : vec2(1.0, 0.0);
}

/**
 * Every vertex sits on the wire's centerline and is pushed out along `offset` in screen pixels, so line widths
 * scale with zoom and each edge gets one pixel of antialiasing fringe.
 */
void main() {
	bool isStrip = a_piece == PIECE_GLOW || a_piece == PIECE_STROKE;
	bool isArrow = a_piece == PIECE_BARB_LEFT || a_piece == PIECE_BARB_RIGHT || a_piece == PIECE_ARROW_TIP;
	bool hasArrow = (a_atTarget > 0.5 ? a_style.w : a_style.z) > 0.5;
	if ((isArrow && !hasArrow) || (a_piece == PIECE_PORT && hasArrow)) {
		// Outside clip space, so the piece is dropped
		gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
		return;
	}

	vec2 center;
	vec2 offset;
	float radius;
	vec4 color;
	if (isStrip) {
		center = pointOnWire(a_along);
		vec2 heading = headingOnWire(a_along);
		vec2 normal = vec2(-heading.y, heading.x);
		// The ends are cut along the node edges rather than square to the wire, so they sit flush
		if (a_along <= 0.0) {
			normal = alignedWith(a_sourceEdge, normal);
		} else if (a_along >= 1.0) {
			normal = alignedWith(a_targetEdge, normal);
		}
		offset = normal * a_side;
		if (a_piece == PIECE_GLOW) {
			radius = GLOW_RADIUS;
			color = colorAt(center);
			color.a *= a_style.x;
		} else {
			radius = STROKE_RADIUS;
			color = strokeColorAt(center);
		}
	} else {
		vec2 tip = a_atTarget > 0.5 ? a_targetPoint : a_sourcePoint;
		color = strokeColorAt(tip);
		if (a_piece == PIECE_PORT) {
			center = tip;
			offset = a_corner;
			radius = PORT_RADIUS;
		} else if (a_piece == PIECE_ARROW_TIP) {
			center = tip;
			offset = a_corner;
			radius = STROKE_RADIUS;
		} else {
			// Barbs reach ARROW_SIZE back from the tip and spread 0.4 x ARROW_SIZE to either side
			vec2 pointing = arrowPointing(tip, a_atTarget > 0.5);
			vec2 spread = vec2(-pointing.y, pointing.x) * (a_piece == PIECE_BARB_LEFT ? 0.4 : -0.4);
			vec2 barb = tip - (pointing - spread) * ARROW_SIZE;
			vec2 barbHeading = normalize(tip - barb);
			center = mix(barb, tip, a_along);
			offset = vec2(-barbHeading.y, barbHeading.x) * a_side;
			radius = STROKE_RADIUS;
		}
	}

	v_radius = radius * u_scale;
	v_local = offset * (max(v_radius, 0.5) + 1.0);
	v_color = color;
	vec2 screen = center * u_scale - u_camera + v_local;
	gl_Position = vec4(screen / u_viewport * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0);
}
