import Box from '@mui/material/Box'
import { RefObject, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useDragDropBusSubscribe } from '@/app/features/dragDrop/hooks/useDragDropBus'
import { dispatchGlobalEvent } from '@/app/features/eventBus'

import { MindmapEmptyState } from './components/MindmapEmptyState'
import { useBoxedMindmapContent } from './hooks/useBoxedMindmapContent'
import { getMindmapState } from './MindmapSliceSelectors'
import { getHoveredMindmapNode } from './utils/getHoveredMindmapNode'
import { ActorNodePositioner } from './workspace/ActorNodePositioner'
import { MindmapWireLayer } from './workspace/MindmapWireLayer'

type Props = {
	cameraRef: RefObject<HTMLDivElement | null>
}

export function MindmapContent({ cameraRef }: Props) {
	const { isLoaded, actorsWithNodes, nodeLinks, existingWires } = useBoxedMindmapContent()

	return (
		<>
			{isLoaded && actorsWithNodes.length === 0 && <MindmapEmptyState />}
			<Box
				ref={cameraRef}
				data-mindmap-camera
				sx={{
					position: 'absolute',
					willChange: 'transform',
					inset: 0,
					zIndex: 1,
					transform: 'translate(var(--grid-offset-x), var(--grid-offset-y))',
					transition:
						'--grid-offset-x var(--transition-duration) ease-out, --grid-offset-y var(--transition-duration) ease-out',
				}}
			>
				<MindmapSelectionBridge />
				<MindmapDropTargetBridge />
				<MindmapWireLayer nodeLinks={nodeLinks} existingWires={existingWires} />
				{actorsWithNodes.map((wrapper) => (
					<ActorNodePositioner key={wrapper.id} parent={wrapper.parent} node={wrapper.node} />
				))}
			</Box>
		</>
	)
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
