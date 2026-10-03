import { WireControlPoints } from '../canvas/MindmapCanvasMath'

export function buildSvgBezierString({ x1, y1, cx1, cy1, cx2, cy2, x2, y2 }: WireControlPoints) {
	return `M ${x1},${y1} C ${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`
}
