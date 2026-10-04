import { useRef } from 'react'
import { useDispatch, useStore } from 'react-redux'
import useEvent from 'react-use-event-hook'

import { useEventBusSubscribe } from '@/app/features/eventBus'
import { RootState } from '@/app/store'
import { isMultiselectAltEvent, isMultiselectEvent } from '@/app/utils/isMultiselectClick'
import { useMindmapContext } from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { mindmapSlice } from '@/app/views/world/views/mindmap/MindmapSlice'
import { MindmapState } from '@/app/views/world/views/mindmap/MindmapState'
import { toWorkspaceCoords } from '@/app/views/world/views/mindmap/utils/toWorkspaceCoords'
import {
	bezierPoint,
	WireControlPoints,
} from '@/app/views/world/views/mindmap/workspace/content/wires/canvas/MindmapCanvasMath'
import { WORKSPACE_SIZE } from '@/app/views/world/views/mindmap/workspace/MindmapWorkspace'
import { deduplicateBy } from '@/ts-shared/utils/deduplicateBy'
import {
	SelectionBox,
	SelectionBoxHandle,
	SelectionRect,
} from '@/ui-lib/components/SelectionBox/SelectionBox'

type Props = {
	ref: React.RefObject<HTMLDivElement | null>
}

export function MindmapSelectionBox({ ref }: Props) {
	const store = useStore<RootState>()
	const dispatch = useDispatch()
	const { wireGeometry } = useMindmapContext()
	const selectionBoxHandle = useRef<SelectionBoxHandle>(null)
	const lastScale = useRef(MindmapState.scale)

	useEventBusSubscribe['mindmap/scale/changed']({
		callback: ({ scale }) => {
			selectionBoxHandle.current?.scaleAround(
				WORKSPACE_SIZE / 2,
				WORKSPACE_SIZE / 2,
				scale / lastScale.current,
			)
			lastScale.current = scale
		},
	})

	const onClick = useEvent((event: MouseEvent) => {
		if (isMultiselectEvent(event)) {
			return
		}
		dispatch(mindmapSlice.actions.clearSelections())
	})

	const onUpdateSelection = useEvent((rect: SelectionRect, event: MouseEvent) => {
		const { selectedNodes, selectedWires } = store.getState().mindmap

		const intersectingNodes = checkNodeIntersection(ref.current, rect)
		const intersectingWires = checkWireIntersection(ref.current, rect, wireGeometry)
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
			handle={selectionBoxHandle}
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

function checkWireIntersection(
	parentElement: HTMLElement | null,
	selectionBox: SelectionRect,
	wireGeometry: Map<string, WireControlPoints>,
) {
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

	return getWiresInRect(wireGeometry, topLeft.x, topLeft.y, bottomRight.x, bottomRight.y)
}

export function getWiresInRect(
	wireGeometry: Map<string, WireControlPoints>,
	svgLeft: number,
	svgTop: number,
	svgRight: number,
	svgBottom: number,
): string[] {
	const result: string[] = []
	wireGeometry.forEach((cp, wireId) => {
		const bboxLeft = Math.min(cp.x1, cp.cx1, cp.cx2, cp.x2)
		const bboxRight = Math.max(cp.x1, cp.cx1, cp.cx2, cp.x2)
		const bboxTop = Math.min(cp.y1, cp.cy1, cp.cy2, cp.y2)
		const bboxBottom = Math.max(cp.y1, cp.cy1, cp.cy2, cp.y2)
		if (svgLeft > bboxRight || svgRight < bboxLeft || svgTop > bboxBottom || svgBottom < bboxTop) {
			return
		}
		const SEGMENTS = 20
		let segmentStart = bezierPoint(cp, 0)
		for (let i = 1; i <= SEGMENTS; i++) {
			const segmentEnd = bezierPoint(cp, i / SEGMENTS)
			if (segmentIntersectsRect(segmentStart, segmentEnd, svgLeft, svgTop, svgRight, svgBottom)) {
				result.push(wireId)
				return
			}
			segmentStart = segmentEnd
		}
	})
	return result
}

function segmentIntersectsRect(
	start: { x: number; y: number },
	end: { x: number; y: number },
	left: number,
	top: number,
	right: number,
	bottom: number,
): boolean {
	const dx = end.x - start.x
	const dy = end.y - start.y
	const boundaries = [
		{ direction: -dx, distance: start.x - left },
		{ direction: dx, distance: right - start.x },
		{ direction: -dy, distance: start.y - top },
		{ direction: dy, distance: bottom - start.y },
	]
	let enter = 0
	let exit = 1
	for (const { direction, distance } of boundaries) {
		if (direction === 0) {
			if (distance < 0) {
				return false
			}
			continue
		}
		const crossing = distance / direction
		if (direction < 0) {
			enter = Math.max(enter, crossing)
		} else {
			exit = Math.min(exit, crossing)
		}
		if (enter > exit) {
			return false
		}
	}
	return true
}
