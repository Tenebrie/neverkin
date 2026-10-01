precision mediump float;
varying vec2 v_local;
varying float v_radius;
varying vec4 v_color;

/** Lines thinner than a pixel are drawn one pixel wide and faded by how much of it they would cover */
void main() {
	float coverage = clamp(max(v_radius, 0.5) + 0.5 - length(v_local), 0.0, 1.0) * min(v_radius * 2.0, 1.0);
	float alpha = v_color.a * coverage;
	gl_FragColor = vec4(v_color.rgb * alpha, alpha);
}