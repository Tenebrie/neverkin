attribute vec2 a_center;
attribute vec2 a_offset;
attribute float a_radius;
attribute vec4 a_color;
uniform float u_scale;
uniform vec2 u_camera;
uniform vec2 u_viewport;
varying vec2 v_local;
varying float v_radius;
varying vec4 v_color;

/**
 * Every vertex sits on the wire's centerline and is pushed out along `a_offset` in screen pixels, so line widths
 * scale with zoom and each edge gets one pixel of antialiasing fringe. Triangles never change on pan or zoom.
 */

void main() {
	v_radius = a_radius * u_scale;
	v_local = a_offset * (max(v_radius, 0.5) + 1.0);
	v_color = a_color;
	vec2 screen = a_center * u_scale - u_camera + v_local;
	gl_Position = vec4(screen / u_viewport * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0);
}
