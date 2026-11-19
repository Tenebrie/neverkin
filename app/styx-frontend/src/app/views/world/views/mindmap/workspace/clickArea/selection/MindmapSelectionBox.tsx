import { useRef } from 'react'
import useEvent from 'react-use-event-hook'

import { useEventBusSubscribe } from '@/app/features/eventBus'
import { ReactiveMap } from '@/app/features/reactivity/ReactiveMap'
import { isMultiselectAltEvent, isMultiselectEvent } from '@/app/utils/isMultiselectClick'
import {
	useMindmapContext,
	useMindmapSelectionContext,
} from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { MindmapState } from '@/app/views/world/views/mindmap/MindmapState'
import { MindmapWireParcel, WaypointSelectionEntry } from '@/app/views/world/views/mindmap/types'
import { toWorkspaceCoords } from '@/app/views/world/views/mindmap/utils/toWorkspaceCoords'
import {
	bezierPoint,
	WireControlPoints,
} from '@/app/views/world/views/mindmap/workspace/content/wires/canvas/MindmapCanvasMath'
import { WORKSPACE_SIZE } from '@/app/views/world/views/mindmap/workspace/MindmapWorkspace'
import {
	SelectionBox,
	SelectionBoxHandle,
	SelectionRect,
} from '@/ui-lib/components/SelectionBox/SelectionBox'

type Props = {
	ref: React.RefObject<HTMLDivElement | null>
}

export function MindmapSelectionBox({ ref }: Props) {
	const { wireGeometry, wires } = useMindmapContext()
	const {
		selectedNodes,
		selectedWires,
		selectedWaypoints,
		setNodeSelection,
		setWireSelection,
		setWaypointSelection,
		hasBulkSelection,
		clearSelections,
	} = useMindmapSelectionContext()
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
		const opensBulkMenu = event.button === 2 && hasBulkSelection()
		if (isMultiselectEvent(event) || opensBulkMenu) {
			return
		}
		clearSelections()
	})

	const onUpdateSelection = useEvent((rect: SelectionRect, event: MouseEvent) => {
		const intersectingNodes = checkNodeIntersection(ref.current, rect)
		const intersectingWires = checkWireIntersection(ref.current, rect, wireGeometry)
		const intersectingWaypoints = checkWaypointIntersection(ref.current, rect, wires)
		let newSelectedNodes: ReturnType<typeof checkNodeIntersection> = []
		let newSelectedWires: ReturnType<typeof checkWireIntersection> = []
		let newSelectedWaypoints: ReturnType<typeof checkWaypointIntersection> = []

		if (isMultiselectEvent(event)) {
			newSelectedNodes.push(...selectedNodes.keys())
			newSelectedWires.push(...selectedWires.keys())
			for (const waypointId of selectedWaypoints.keys()) {
				const wireId = selectedWaypoints.get(waypointId)
				if (wireId) {
					newSelectedWaypoints.push({ waypointId, wireId })
				}
			}
		}

		if (isMultiselectAltEvent(event)) {
			newSelectedNodes = newSelectedNodes.filter(
				(node) => !intersectingNodes.some((intersectingNode) => intersectingNode === node),
			)
			newSelectedWires = newSelectedWires.filter(
				(wireId) => !intersectingWires.some((intersectingWireId) => intersectingWireId === wireId),
			)
			newSelectedWaypoints = newSelectedWaypoints.filter(
				(entry) =>
					!intersectingWaypoints.some((intersecting) => intersecting.waypointId === entry.waypointId),
			)
		} else {
			newSelectedNodes.push(...intersectingNodes)
			newSelectedWires.push(...intersectingWires)
			newSelectedWaypoints.push(...intersectingWaypoints)
		}

		newSelectedNodes = [...new Set(newSelectedNodes)]
		newSelectedWires = [...new Set(newSelectedWires)]
		newSelectedWaypoints = [
			...new Map(newSelectedWaypoints.map((entry) => [entry.waypointId, entry])).values(),
		]

		setNodeSelection(newSelectedNodes)
		setWireSelection(newSelectedWires)
		setWaypointSelection(newSelectedWaypoints)
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
	const selectedNodeIds = [] as string[]

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
			if (nodeId) {
				selectedNodeIds.push(nodeId)
			}
		}
	})

	return [...new Set(selectedNodeIds)]
}

function checkWireIntersection(
	parentElement: HTMLElement | null,
	selectionBox: SelectionRect,
	wireGeometry: Map<string, WireControlPoints[]>,
) {
	const box = toWorkspaceRect(parentElement, selectionBox)
	if (!box) {
		return []
	}
	return getWiresInRect(wireGeometry, box.left, box.top, box.right, box.bottom)
}

function checkWaypointIntersection(
	parentElement: HTMLElement | null,
	selectionBox: SelectionRect,
	wires: ReactiveMap<string, MindmapWireParcel>,
): WaypointSelectionEntry[] {
	const box = toWorkspaceRect(parentElement, selectionBox)
	if (!box) {
		return []
	}
	const entries: WaypointSelectionEntry[] = []
	for (const parcel of wires.values()) {
		for (const waypoint of parcel.wire.waypoints) {
			const isInside =
				waypoint.positionX >= box.left &&
				waypoint.positionX <= box.right &&
				waypoint.positionY >= box.top &&
				waypoint.positionY <= box.bottom
			if (isInside) {
				entries.push({ waypointId: waypoint.id, wireId: parcel.wire.id })
			}
		}
	}
	return entries
}

/** The selection rect in workspace coordinates, whichever way it was dragged out */
function toWorkspaceRect(parentElement: HTMLElement | null, selectionBox: SelectionRect) {
	if (!parentElement) {
		return null
	}

	const boxLeft = selectionBox.width < 0 ? selectionBox.x + selectionBox.width : selectionBox.x
	const boxTop = selectionBox.height < 0 ? selectionBox.y + selectionBox.height : selectionBox.y
	const boxRight = boxLeft + Math.abs(selectionBox.width)
	const boxBottom = boxTop + Math.abs(selectionBox.height)

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
		return null
	}
	return { left: topLeft.x, top: topLeft.y, right: bottomRight.x, bottom: bottomRight.y }
}

export function getWiresInRect(
	wireGeometry: Map<string, WireControlPoints[]>,
	svgLeft: number,
	svgTop: number,
	svgRight: number,
	svgBottom: number,
): string[] {
	const result: string[] = []
	wireGeometry.forEach((curves, wireId) => {
		if (curves.some((cp) => curveIntersectsRect(cp, svgLeft, svgTop, svgRight, svgBottom))) {
			result.push(wireId)
		}
	})
	return result
}

function curveIntersectsRect(
	cp: WireControlPoints,
	left: number,
	top: number,
	right: number,
	bottom: number,
): boolean {
	const bboxLeft = Math.min(cp.x1, cp.cx1, cp.cx2, cp.x2)
	const bboxRight = Math.max(cp.x1, cp.cx1, cp.cx2, cp.x2)
	const bboxTop = Math.min(cp.y1, cp.cy1, cp.cy2, cp.y2)
	const bboxBottom = Math.max(cp.y1, cp.cy1, cp.cy2, cp.y2)
	if (left > bboxRight || right < bboxLeft || top > bboxBottom || bottom < bboxTop) {
		return false
	}
	const SEGMENTS = 20
	let segmentStart = bezierPoint(cp, 0)
	for (let i = 1; i <= SEGMENTS; i++) {
		const segmentEnd = bezierPoint(cp, i / SEGMENTS)
		if (segmentIntersectsRect(segmentStart, segmentEnd, left, top, right, bottom)) {
			return true
		}
		segmentStart = segmentEnd
	}
	return false
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
