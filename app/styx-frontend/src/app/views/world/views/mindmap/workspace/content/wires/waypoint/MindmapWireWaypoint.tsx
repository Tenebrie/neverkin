import Box from '@mui/material/Box'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { MindmapWire } from '@/api/types/mindmapTypes'
import { dispatchGlobalEvent, useEventBusSubscribe } from '@/app/features/eventBus'
import { useDoubleClick } from '@/app/hooks/useDoubleClick'
import { useDraggableClick } from '@/app/hooks/useDraggableClick'
import { isMultiselectEvent } from '@/app/utils/isMultiselectClick'
import {
	useMindmapContext,
	useMindmapSelectionContext,
} from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { WaypointSelectionEntry } from '@/app/views/world/views/mindmap/types'
import { getMovingWaypointIds } from '@/app/views/world/views/mindmap/utils/getMovingWaypointIds'
import { Point } from '@/app/views/world/views/mindmap/workspace/content/wires/canvas/MindmapCanvasMath'
import { useMindmapWaypointDrag } from '@/app/views/world/views/mindmap/workspace/content/wires/hooks/useMindmapWaypointDrag'

type Props = {
	wireId: string
	waypoint: MindmapWire['waypoints'][number]
	index: number
	color: string
	onMove: (index: number, point: Point) => void
}

export function MindmapWireWaypoint({ wireId, waypoint, index, color, onMove }: Props) {
	const { wires, moveElements, deleteWaypoints } = useMindmapContext()
	const {
		selectedNodes,
		selectedWires,
		selectedWaypoints,
		addWaypointsToSelection,
		removeWaypointsFromSelection,
	} = useMindmapSelectionContext()
	const ref = useRef<SVGGElement>(null)
	const selectedRef = useRef(false)
	const [currentState] = useState(() => ({
		x: waypoint.positionX,
		y: waypoint.positionY,
		grabX: 0,
		grabY: 0,
	}))

	useLayoutEffect(() => {
		currentState.x = waypoint.positionX
		currentState.y = waypoint.positionY
	})

	useLayoutEffect(() => {
		const applySelection = () => {
			selectedRef.current = selectedWaypoints.has(waypoint.id)
			ref.current?.setAttribute('data-selected', String(selectedRef.current))
		}
		applySelection()
		return selectedWaypoints.subscribe(waypoint.id, applySelection)
	}, [selectedWaypoints, waypoint.id])

	useEffect(
		() => () => {
			removeWaypointsFromSelection([waypoint.id])
		},
		[removeWaypointsFromSelection, waypoint.id],
	)

	/** The waypoints drawn on top of each other at this spot; the user sees them as one handle */
	const stack = () => {
		const entries: WaypointSelectionEntry[] = []
		for (const parcel of wires.values()) {
			for (const other of parcel.wire.waypoints) {
				if (other.positionX === waypoint.positionX && other.positionY === waypoint.positionY) {
					entries.push({ waypointId: other.id, wireId: parcel.wire.id })
				}
			}
		}
		return entries
	}

	const place = (point: Point) => {
		currentState.x = point.x
		currentState.y = point.y
		ref.current?.setAttribute('transform', `translate(${point.x} ${point.y})`)
		onMove(index, point)
	}

	const dragTo = (point: Point) => {
		const next = { x: point.x + currentState.grabX, y: point.y + currentState.grabY }
		const deltaX = next.x - currentState.x
		const deltaY = next.y - currentState.y
		place(next)
		dispatchGlobalEvent['mindmap/selection/onDragUpdate']({ sourceId: waypoint.id, deltaX, deltaY })
	}

	const onPointerDown = useMindmapWaypointDrag({
		onStart: (point) => {
			if (!selectedRef.current) {
				addWaypointsToSelection({ entries: stack(), multiselect: false })
			}
			currentState.grabX = currentState.x - point.x
			currentState.grabY = currentState.y - point.y
			dispatchGlobalEvent['mindmap/selection/onDragStart']({ sourceId: waypoint.id })
		},
		onMove: dragTo,
		onEnd: (point) => {
			dragTo(point)
			const snappedX = Math.round(currentState.x)
			const snappedY = Math.round(currentState.y)
			dragTo({ x: snappedX - currentState.grabX, y: snappedY - currentState.grabY })
			moveElements({
				nodeIds: selectedNodes.keys(),
				waypointIds: getMovingWaypointIds({ selectedWaypoints, selectedWires, wires }),
				deltaX: snappedX - waypoint.positionX,
				deltaY: snappedY - waypoint.positionY,
			})
			dispatchGlobalEvent['mindmap/selection/onDragEnd']({ sourceId: waypoint.id })
		},
	})

	useEventBusSubscribe['mindmap/selection/onDragUpdate']({
		callback: ({ sourceId, deltaX, deltaY }) => {
			const isMoving = selectedRef.current || selectedWires.has(wireId)
			if (sourceId === waypoint.id || !isMoving) {
				return
			}
			place({ x: currentState.x + deltaX, y: currentState.y + deltaY })
		},
	})

	const { triggerClick } = useDoubleClick<{ multiselect: boolean }>({
		onClick: ({ multiselect }) => {
			if (selectedRef.current) {
				removeWaypointsFromSelection(stack().map((entry) => entry.waypointId))
			} else {
				addWaypointsToSelection({ entries: stack(), multiselect })
			}
		},
		onDoubleClick: () => deleteWaypoints(stack().map((entry) => entry.waypointId)),
		ignoreDelay: true,
	})

	const { onMouseDown, onMouseUp } = useDraggableClick({
		onRightClick: (event) => {
			dispatchGlobalEvent['mindmap/waypoint/requestOpenContextMenu']({
				position: { x: event.clientX, y: event.clientY },
				stack: stack(),
			})
		},
	})

	return (
		<Box
			component="g"
			data-testid="MindmapWireWaypoint"
			ref={ref}
			transform={`translate(${waypoint.positionX} ${waypoint.positionY})`}
			onPointerDown={onPointerDown}
			onMouseDown={onMouseDown}
			onMouseUp={onMouseUp}
			onClick={(event: React.MouseEvent<SVGGElement>) =>
				triggerClick(event, { multiselect: isMultiselectEvent(event) })
			}
			sx={(theme) => {
				const lightnessStep = theme.palette.mode === 'dark' ? 0.1 : -0.1
				return {
					'--waypoint-stroke': color,
					'--waypoint-opacity': 0,
					cursor: 'pointer',
					'&:hover': {
						'--waypoint-opacity': 1,
						'--waypoint-stroke': `oklch(from ${color} calc(l + ${lightnessStep * 0.5}) c h)`,
					},
					'&[data-selected="true"]': {
						'--waypoint-opacity': 1,
						'--waypoint-stroke': `oklch(from ${color} calc(l + ${2 * lightnessStep}) c h)`,
					},
					'&:active': {
						'--waypoint-stroke': `oklch(from ${color} calc(l - ${lightnessStep}) c h)`,
					},
				}
			}}
		>
			<circle fill="none" pointerEvents="fill" style={{ r: 'calc(var(--wire-hit-width) / 2 * 1.5)' }} />
			<circle
				fill="none"
				pointerEvents="none"
				vectorEffect="non-scaling-stroke"
				style={{
					r: 'calc(var(--wire-hit-width) / 2)',
					stroke: 'var(--waypoint-stroke)',
					strokeOpacity: 'var(--waypoint-opacity)',
					strokeWidth: 2,
					transition: 'stroke-opacity 0.1s ease-out, stroke 0.1s ease-out',
				}}
			/>
		</Box>
	)
}
