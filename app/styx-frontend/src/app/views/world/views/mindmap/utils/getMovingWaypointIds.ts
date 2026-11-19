import { ReactiveMap } from '@/app/features/reactivity/ReactiveMap'
import { MindmapWireParcel } from '@/app/views/world/views/mindmap/types'

type Props = {
	selectedWaypoints: ReactiveMap<string, string>
	selectedWires: ReactiveMap<string, true>
	wires: ReactiveMap<string, MindmapWireParcel>
}

/** The waypoints a selection drag carries: the selected ones and those of the selected wires */
export function getMovingWaypointIds({ selectedWaypoints, selectedWires, wires }: Props): string[] {
	const ids = new Set(selectedWaypoints.keys())
	for (const wireId of selectedWires.keys()) {
		for (const waypoint of wires.get(wireId)?.wire.waypoints ?? []) {
			ids.add(waypoint.id)
		}
	}
	return [...ids]
}
