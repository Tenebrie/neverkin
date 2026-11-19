import { ReactiveMap } from '@/app/features/reactivity/ReactiveMap'

import { MindmapWireParcel } from '../types'

export function getMindmapWaypointSiblings(
	wires: ReactiveMap<string, MindmapWireParcel>,
	waypointId: string,
) {
	const waypoints = [...wires.values()].flatMap((parcel) => parcel.wire.waypoints)
	const target = waypoints.find((waypoint) => waypoint.id === waypointId)
	const siblings = new Set([waypointId])
	if (!target) {
		return siblings
	}

	for (const waypoint of waypoints) {
		if (waypoint.positionX === target.positionX && waypoint.positionY === target.positionY) {
			siblings.add(waypoint.id)
		}
	}
	return siblings
}
