import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { dispatchGlobalEvent } from '@/app/features/eventBus'

import { getMindmapState } from '../../../MindmapSliceSelectors'

export function MindmapSelectionReporter() {
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
		dispatchGlobalEvent['mindmap/hover/changed']({
			hoveredNodeIds: new Set(hoveredNodes.map((n) => n.key)),
			hoveredWireIds: new Set(hoveredWires),
		})
	}, [hoveredNodes, hoveredWires])

	return null
}
