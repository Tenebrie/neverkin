import Box from '@mui/material/Box'
import { useEffect, useLayoutEffect } from 'react'
import { useSelector } from 'react-redux'

import { useDragDropBusSubscribe } from '@/app/features/dragDrop/hooks/useDragDropBus'
import { dispatchGlobalEvent } from '@/app/features/eventBus'

import { useBoxedMindmapContent } from './hooks/useBoxedMindmapContent'
import { useMindmapNodeIds } from './hooks/useMindmapContentStore'
import { getMindmapState } from './MindmapSliceSelectors'
import { getHoveredMindmapNode } from './utils/getHoveredMindmapNode'
import { mindmapExistingWireStore, mindmapNodeStore, mindmapWireStore } from './utils/MindmapContentStore'
import { ActorNodePositioner } from './workspace/ActorNodePositioner'
import { MindmapWireLayer } from './workspace/MindmapWireLayer'

export function MindmapContent() {
	const nodeIds = useMindmapNodeIds()

	return (
		<Box
			sx={{
				position: 'absolute',
				left: 'var(--grid-origin)',
				top: 'var(--grid-origin)',
				zIndex: 1,
			}}
		>
			<MindmapContentPublisher />
			<MindmapSelectionBridge />
			<MindmapDropTargetBridge />
			<MindmapWireLayer />
			{nodeIds.map((nodeId) => (
				<ActorNodePositioner key={nodeId} nodeId={nodeId} />
			))}
		</Box>
	)
}

function MindmapContentPublisher() {
	const { nodes, wires, existingWires } = useBoxedMindmapContent()

	useLayoutEffect(() => {
		mindmapNodeStore.replace(nodes)
		mindmapWireStore.replace(wires)
		mindmapExistingWireStore.set(existingWires)
	}, [nodes, wires, existingWires])

	return null
}

function MindmapSelectionBridge() {
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
	}, [hoveredNodes, hoveredWires, selectedNodes, selectedWires])

	return null
}

function MindmapDropTargetBridge() {
	useDragDropBusSubscribe({
		callback: (state) => {
			dispatchGlobalEvent['mindmap/dropTarget/changed']({
				target: state?.isHandled ? null : (getHoveredMindmapNode() ?? null),
			})
		},
	})

	return null
}
