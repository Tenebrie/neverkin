import { MindmapNodeLayout } from '@/app/views/world/views/mindmap/types'

import { Point } from '../canvas/MindmapCanvasMath'
import { WireEndpoints } from '../canvas/MindmapWireBuffer'
import { getNearestEdgePoint } from './getNearestEdgePoint'
import { getRectCenter } from './getRectCenter'

export function getEdgePoints(
	source: MindmapNodeLayout,
	target: MindmapNodeLayout,
	waypoints: Point[],
): WireEndpoints {
	const sourceAim = waypoints.at(0) ?? getRectCenter(target)
	const targetAim = waypoints.at(-1) ?? getRectCenter(source)

	const src = getNearestEdgePoint(source, sourceAim.x, sourceAim.y)
	const tgt = getNearestEdgePoint(target, targetAim.x, targetAim.y)

	return { x1: src.x, y1: src.y, x2: tgt.x, y2: tgt.y, nx1: src.nx, ny1: src.ny, nx2: tgt.nx, ny2: tgt.ny }
}
