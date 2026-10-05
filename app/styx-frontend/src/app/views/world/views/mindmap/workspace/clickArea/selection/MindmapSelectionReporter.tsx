import { useLayoutEffect } from 'react'

import { dispatchGlobalEvent } from '@/app/features/eventBus'
import {
	useMindmapContext,
	useMindmapSelectionContext,
} from '@/app/views/world/views/mindmap/context/useMindmapContext'

export function MindmapSelectionReporter() {
	const { wires } = useMindmapContext()
	const { hoveredNodes, hoveredWires } = useMindmapSelectionContext()

	useLayoutEffect(() => {
		const report = () => {
			const hoveredNodeIds = new Set(hoveredNodes.keys())
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
				hoveredWireIds: new Set(hoveredWires.keys()),
				highlightedWireIds,
			})
		}
		const unsubscribeNodes = hoveredNodes.subscribeToKeys(report)
		const unsubscribeWires = hoveredWires.subscribeToKeys(report)
		return () => {
			unsubscribeNodes()
			unsubscribeWires()
		}
	}, [hoveredNodes, hoveredWires, wires])

	return null
}
