import { useDispatch, useStore } from 'react-redux'
import useEvent from 'react-use-event-hook'

import { RootState } from '@/app/store'
import { isMultiselectAltEvent, isMultiselectEvent } from '@/app/utils/isMultiselectClick'
import { deduplicateBy } from '@/ts-shared/utils/deduplicateBy'
import { SelectionBox, SelectionRect } from '@/ui-lib/components/SelectionBox/SelectionBox'

import { mindmapSlice } from '../../../MindmapSlice'
import { getWiresInRect } from '../../../unrefactored/mindmapWireUtils'
import { toWorkspaceCoords } from '../../../utils/toWorkspaceCoords'

type Props = {
	ref: React.RefObject<HTMLDivElement | null>
}

export function MindmapSelectionBox({ ref }: Props) {
	const store = useStore<RootState>()
	const dispatch = useDispatch()

	const onClick = useEvent((event: MouseEvent) => {
		if (isMultiselectEvent(event)) {
			return
		}
		dispatch(mindmapSlice.actions.clearSelections())
	})

	const onUpdateSelection = useEvent((rect: SelectionRect, event: MouseEvent) => {
		const { selectedNodes, selectedWires } = store.getState().mindmap

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

		newSelectedNodes = deduplicateBy(newSelectedNodes, (node) => node.key)
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
	const selectedNodeIds = [] as { key: string; actorId: string }[]

	// Normalize selection box coordinates (handle negative width/height)
	const boxLeft = selectionBox.width < 0 ? selectionBox.x + selectionBox.width : selectionBox.x
	const boxTop = selectionBox.height < 0 ? selectionBox.y + selectionBox.height : selectionBox.y
	const boxRight = boxLeft + Math.abs(selectionBox.width)
	const boxBottom = boxTop + Math.abs(selectionBox.height)

	const containerRect = parentElement.getBoundingClientRect()

	nodes.forEach((nodeElement) => {
		const rect = nodeElement.getBoundingClientRect()

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
				selectedNodeIds.push({ key: nodeId, actorId })
			}
		}
	})

	return deduplicateBy(selectedNodeIds, (item) => item.key)
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
	const topLeft = toWorkspaceCoords({
		screenX: containerRect.left + boxLeft,
		screenY: containerRect.top + boxTop,
	})
	const bottomRight = toWorkspaceCoords({
		screenX: containerRect.left + boxRight,
		screenY: containerRect.top + boxBottom,
	})
	if (!topLeft || !bottomRight) {
		return []
	}

	return getWiresInRect(topLeft.x, topLeft.y, bottomRight.x, bottomRight.y)
}
