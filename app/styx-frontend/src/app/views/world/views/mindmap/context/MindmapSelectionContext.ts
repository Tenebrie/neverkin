import { useState } from 'react'
import useEvent from 'react-use-event-hook'

import { createRealtimeContext } from '@/app/components/RealtimeContext/RealtimeContext'
import { ReactiveMap } from '@/app/features/reactivity/ReactiveMap'
import { WaypointSelectionEntry } from '@/app/views/world/views/mindmap/types'

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
		clearSelections,
		addNodeToHover,
		removeNodeFromHover,
		addWireToHover,
		removeWireFromHover,
	}
})
