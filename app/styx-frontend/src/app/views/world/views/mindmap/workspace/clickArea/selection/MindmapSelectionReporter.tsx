import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { dispatchGlobalEvent } from '@/app/features/eventBus'
import { useMindmapContext } from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { getMindmapState } from '@/app/views/world/views/mindmap/MindmapSliceSelectors'

export function MindmapSelectionReporter() {
	const { wires } = useMindmapContext()
	const { selectedNodes, selectedWires } = useSelector(getMindmapState, (a, b) => {
		return a.selectedNodes === b.selectedNodes && a.selectedWires === b.selectedWires
	})
	const { hoveredNodes, hoveredWires } = useSelector(getMindmapState, (a, b) => {
		return a.hoveredNodes === b.hoveredNodes && a.hoveredWires === b.hoveredWires
	})

	useEffect(() => {
		dispatchGlobalEvent['mindmap/selection/changed']({
			selectedNodeIds: new Set(selectedNodes.map((n) => n.key)),
			selectedWireIds: new Set(selectedWires),
		})
	}, [selectedNodes, selectedWires])

	useEffect(() => {
		const hoveredNodeIds = new Set(hoveredNodes.map((n) => n.key))
		const highlightedWireIds = new Set<string>()
		if (hoveredNodeIds.size > 0) {
			for (const { wire } of wires.values()) {
				if (hoveredNodeIds.has(wire.sourceNodeId)) {
					highlightedWireIds.add(wire.targetNodeId)
				}
				if (hoveredNodeIds.has(wire.targetNodeId)) {
					highlightedWireIds.add(wire.sourceNodeId)
				}
			}
		}
		dispatchGlobalEvent['mindmap/hover/changed']({
			hoveredNodeIds,
			hoveredWireIds: new Set(hoveredWires),
			highlightedWireIds,
		})
	}, [hoveredNodes, hoveredWires, wires])

	return null
}
