import { MindmapNodeLayout } from '@/app/views/world/views/mindmap/types'

import { WireEndpoints } from '../canvas/MindmapWireBuffer'
import { getNearestEdgePoint } from './getNearestEdgePoint'
import { getRectCenter } from './getRectCenter'

export function getEdgePoints(source: MindmapNodeLayout, target: MindmapNodeLayout): WireEndpoints {
	const srcCenter = getRectCenter(source)
	const tgtCenter = getRectCenter(target)

	const src = getNearestEdgePoint(source, tgtCenter.x, tgtCenter.y)
	const tgt = getNearestEdgePoint(target, srcCenter.x, srcCenter.y)

	return { x1: src.x, y1: src.y, x2: tgt.x, y2: tgt.y, nx1: src.nx, ny1: src.ny, nx2: tgt.nx, ny2: tgt.ny }
}
