import { ReactiveMap } from '@/app/features/reactivity/ReactiveMap'
import { MindmapState } from '@/app/views/world/views/mindmap/MindmapState'
import { MindmapWireParcel } from '@/app/views/world/views/mindmap/types'
import { Point } from '@/app/views/world/views/mindmap/workspace/content/wires/canvas/MindmapCanvasMath'

const MERGE_SNAP_RADIUS = 12 // pixels

/** Positions of every waypoint other than the moving ones */
export function collectMergeTargets(wires: ReactiveMap<string, MindmapWireParcel>, movingIds: Set<string>) {
	const targets: Point[] = []
	for (const parcel of wires.values()) {
		for (const waypoint of parcel.wire.waypoints) {
			if (!movingIds.has(waypoint.id)) {
				targets.push({ x: waypoint.positionX, y: waypoint.positionY })
			}
		}
	}
	return targets
}

/** Returns `point`, or the merge target it is close enough to snap onto */
export function snapToMergeTarget(point: Point, targets: Point[]) {
	let nearest = point
	let nearestDistance = MERGE_SNAP_RADIUS / MindmapState.scale
	for (const target of targets) {
		const distance = Math.hypot(target.x - point.x, target.y - point.y)
		if (distance < nearestDistance) {
			nearestDistance = distance
			nearest = target
		}
	}
	return nearest
}
