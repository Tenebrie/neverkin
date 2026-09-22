import Box from '@mui/material/Box'
import { useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useEvent from 'react-use-event-hook'

import { isMultiselectAltEvent, isMultiselectEvent } from '@/app/utils/isMultiselectClick'
import { SelectionBox, SelectionRect } from '@/ui-lib/components/SelectionBox/SelectionBox'

import { useNewNodeReceiver } from '../hooks/useNewNodeReceiver'
import { mindmapSlice } from '../MindmapSlice'
import { getMindmapState } from '../MindmapSliceSelectors'
import { getMindmapGridPosition } from '../utils/getMindmapGridPosition'
import { getWiresInRect } from './mindmapWireUtils'

export function MindmapClickArea() {
	const ref = useRef<HTMLDivElement>(null)
	useNewNodeReceiver({ ref })

	return (
		<>
			<Box
				data-mindmap-click-area
				ref={ref}
				sx={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}
			></Box>
			<MindmapSelectionBox ref={ref} />
		</>
	)
}

function MindmapSelectionBox({ ref }: { ref: React.RefObject<HTMLDivElement | null> }) {
	const { selectedNodes, selectedWires } = useSelector(
		getMindmapState,
		(a, b) => a.selectedNodes === b.selectedNodes && a.selectedWires === b.selectedWires,
	)
	const dispatch = useDispatch()

	const onClick = useEvent((event: MouseEvent) => {
		if (isMultiselectEvent(event)) {
			return
		}
		dispatch(mindmapSlice.actions.clearSelections())
	})

	const onUpdateSelection = useEvent((rect: SelectionRect, event: MouseEvent) => {
		const intersectingNodes = checkNodeIntersection(ref.current, rect)
		const intersectingWires = checkWireIntersection(ref.current, rect)
		let newSelectedNodes: ReturnType<typeof checkNodeIntersection> = []
		let newSelectedWires: ReturnType<typeof checkWireIntersection> = []

		if (isMultiselectEvent(event)) {
			newSelectedNodes.push(...selectedNodes)
			newSelectedWires.push(...selectedWires)
		}

		if (isMultiselectAltEvent(event)) {
			newSelectedNodes = newSelectedNodes.filter(
				(node) => !intersectingNodes.some((intersectingNode) => intersectingNode.key === node.key),
			)
			newSelectedWires = newSelectedWires.filter(
				(wireId) => !intersectingWires.some((intersectingWireId) => intersectingWireId === wireId),
			)
		} else {
			newSelectedNodes.push(...intersectingNodes)
			newSelectedWires.push(...intersectingWires)
		}

		newSelectedNodes = [...new Set(newSelectedNodes)]
		newSelectedWires = [...new Set(newSelectedWires)]

		const nodesChanged =
			selectedNodes.length !== newSelectedNodes.length ||
			!selectedNodes.every((node) => newSelectedNodes.some((newNode) => newNode.key === node.key))
		const wiresChanged =
			selectedWires.length !== newSelectedWires.length ||
			!selectedWires.every((wireId, i) => wireId === newSelectedWires[i])

		if (nodesChanged) {
			dispatch(mindmapSlice.actions.setNodeSelection(newSelectedNodes))
		}
		if (wiresChanged) {
			dispatch(mindmapSlice.actions.setWireSelection(newSelectedWires))
		}
	})

	return (
		<SelectionBox
			ref={ref}
			onClick={onClick}
			onUpdateSelection={onUpdateSelection}
			onFinalizeSelection={onUpdateSelection}
		/>
	)
}

function checkNodeIntersection(parentElement: HTMLElement | null, selectionBox: SelectionRect) {
	if (!parentElement) {
		return []
	}
	const nodes = document.querySelectorAll('[data-mindmap-node]')
	const selectedNodeIds = new Set<string>()

	// Normalize selection box coordinates (handle negative width/height)
	const boxLeft = selectionBox.width < 0 ? selectionBox.x + selectionBox.width : selectionBox.x
	const boxTop = selectionBox.height < 0 ? selectionBox.y + selectionBox.height : selectionBox.y
	const boxRight = boxLeft + Math.abs(selectionBox.width)
	const boxBottom = boxTop + Math.abs(selectionBox.height)

	nodes.forEach((nodeElement) => {
		const rect = nodeElement.getBoundingClientRect()
		const containerRect = parentElement.getBoundingClientRect()

		// Convert node position to container-relative coordinates
		const nodeLeft = rect.left - containerRect.left
		const nodeTop = rect.top - containerRect.top
		const nodeRight = nodeLeft + rect.width
		const nodeBottom = nodeTop + rect.height

		// Check if boxes intersect
		const intersects =
			boxLeft < nodeRight && boxRight > nodeLeft && boxTop < nodeBottom && boxBottom > nodeTop

		if (intersects) {
			const nodeId = nodeElement.getAttribute('data-mindmap-node')
			const actorId = nodeElement.getAttribute('data-entity-id')
			if (nodeId && actorId) {
				selectedNodeIds.add(JSON.stringify({ key: nodeId, actorId }))
			}
		}
	})

	return Array.from(selectedNodeIds).map((str) => JSON.parse(str) as { key: string; actorId: string })
}

function checkWireIntersection(parentElement: HTMLElement | null, selectionBox: SelectionRect) {
	if (!parentElement) {
		return []
	}

	const boxLeft = selectionBox.width < 0 ? selectionBox.x + selectionBox.width : selectionBox.x
	const boxTop = selectionBox.height < 0 ? selectionBox.y + selectionBox.height : selectionBox.y
	const boxRight = boxLeft + Math.abs(selectionBox.width)
	const boxBottom = boxTop + Math.abs(selectionBox.height)

	// Convert selection rect from container coords to SVG node coords using grid transform
	const containerRect = parentElement.getBoundingClientRect()
	const topLeft = getMindmapGridPosition({
		screenX: containerRect.left + boxLeft,
		screenY: containerRect.top + boxTop,
	})
	const bottomRight = getMindmapGridPosition({
		screenX: containerRect.left + boxRight,
		screenY: containerRect.top + boxBottom,
	})
	if (!topLeft || !bottomRight) {
		return []
	}

	return getWiresInRect(topLeft.x, topLeft.y, bottomRight.x, bottomRight.y)
}
