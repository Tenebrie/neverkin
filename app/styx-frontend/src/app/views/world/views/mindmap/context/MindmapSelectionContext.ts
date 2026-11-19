import { useState } from 'react'
import useEvent from 'react-use-event-hook'

import { createRealtimeContext } from '@/app/components/RealtimeContext/RealtimeContext'
import { ReactiveMap } from '@/app/features/reactivity/ReactiveMap'
import {
	MindmapNodeParcel,
	MindmapWireParcel,
	WaypointSelectionEntry,
} from '@/app/views/world/views/mindmap/types'

export const MindmapSelectionContext = createRealtimeContext(() => {
	const [selectedNodes] = useState(() => new ReactiveMap<string, true>())
	const [selectedWires] = useState(() => new ReactiveMap<string, true>())
	const [selectedWaypoints] = useState(() => new ReactiveMap<string, string>())
	const [hoveredNodes] = useState(() => new ReactiveMap<string, true>())
	const [hoveredWires] = useState(() => new ReactiveMap<string, true>())

	const addNodeToSelection = useEvent(({ id, multiselect }: { id: string; multiselect: boolean }) => {
		if (multiselect) {
			selectedNodes.set(id, true)
			return
		}
		selectedNodes.replace(new Map([[id, true]]))
		selectedWires.replace(new Map())
		selectedWaypoints.replace(new Map())
	})

	const setNodeSelection = useEvent((nodeIds: string[]) => {
		selectedNodes.replace(new Map(nodeIds.map((nodeId) => [nodeId, true])))
	})

	const removeNodeFromSelection = useEvent((nodeId: string) => {
		selectedNodes.delete(nodeId)
	})

	const addWireToSelection = useEvent(({ wireId, multiselect }: { wireId: string; multiselect: boolean }) => {
		if (multiselect) {
			selectedWires.set(wireId, true)
			return
		}
		selectedWires.replace(new Map([[wireId, true]]))
		selectedNodes.replace(new Map())
		selectedWaypoints.replace(new Map())
	})

	const setWireSelection = useEvent((wireIds: string[]) => {
		selectedWires.replace(new Map(wireIds.map((wireId) => [wireId, true])))
	})

	const removeWireFromSelection = useEvent((wireId: string) => {
		selectedWires.delete(wireId)
	})

	const addWaypointsToSelection = useEvent(
		({ entries, multiselect }: { entries: WaypointSelectionEntry[]; multiselect: boolean }) => {
			if (multiselect) {
				for (const { waypointId, wireId } of entries) {
					selectedWaypoints.set(waypointId, wireId)
				}
				return
			}
			setWaypointSelection(entries)
			selectedNodes.replace(new Map())
			selectedWires.replace(new Map())
		},
	)

	const setWaypointSelection = useEvent((entries: WaypointSelectionEntry[]) => {
		selectedWaypoints.replace(new Map(entries.map(({ waypointId, wireId }) => [waypointId, wireId])))
	})

	const removeWaypointsFromSelection = useEvent((waypointIds: string[]) => {
		for (const waypointId of waypointIds) {
			selectedWaypoints.delete(waypointId)
		}
	})

	const hasBulkSelection = useEvent(() => selectedNodes.size() + selectedWires.size() > 1)

	const dropMissingFromSelection = useEvent(
		(nodes: Map<string, MindmapNodeParcel>, wires: Map<string, MindmapWireParcel>) => {
			for (const nodeId of selectedNodes.keys().filter((id) => !nodes.has(id))) {
				selectedNodes.delete(nodeId)
			}
			for (const wireId of selectedWires.keys().filter((id) => !wires.has(id))) {
				selectedWires.delete(wireId)
			}
			const waypointIds = new Set(
				[...wires.values()].flatMap((parcel) => parcel.wire.waypoints.map((waypoint) => waypoint.id)),
			)
			for (const waypointId of selectedWaypoints.keys().filter((id) => !waypointIds.has(id))) {
				selectedWaypoints.delete(waypointId)
			}
		},
	)

	const clearSelections = useEvent(() => {
		selectedNodes.replace(new Map())
		selectedWires.replace(new Map())
		selectedWaypoints.replace(new Map())
	})

	const addNodeToHover = useEvent((nodeId: string) => {
		hoveredNodes.set(nodeId, true)
	})

	const removeNodeFromHover = useEvent((nodeId: string) => {
		hoveredNodes.delete(nodeId)
	})

	const addWireToHover = useEvent((wireId: string) => {
		hoveredWires.set(wireId, true)
	})

	const removeWireFromHover = useEvent((wireId: string) => {
		hoveredWires.delete(wireId)
	})

	return {
		selectedNodes,
		selectedWires,
		selectedWaypoints,
		hoveredNodes,
		hoveredWires,
		addNodeToSelection,
		setNodeSelection,
		removeNodeFromSelection,
		addWireToSelection,
		setWireSelection,
		removeWireFromSelection,
		addWaypointsToSelection,
		setWaypointSelection,
		removeWaypointsFromSelection,
		hasBulkSelection,
		dropMissingFromSelection,
		clearSelections,
		addNodeToHover,
		removeNodeFromHover,
		addWireToHover,
		removeWireFromHover,
	}
})
