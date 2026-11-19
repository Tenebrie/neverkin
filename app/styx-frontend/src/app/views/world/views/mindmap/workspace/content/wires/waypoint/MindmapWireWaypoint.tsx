import Box from '@mui/material/Box'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { MindmapWire } from '@/api/types/mindmapTypes'
import { dispatchGlobalEvent, useEventBusSubscribe } from '@/app/features/eventBus'
import { useDoubleClick } from '@/app/hooks/useDoubleClick'
import { isMultiselectEvent } from '@/app/utils/isMultiselectClick'
import {
	useMindmapContext,
	useMindmapSelectionContext,
} from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { getMindmapWaypointSiblings } from '@/app/views/world/views/mindmap/utils/getMindmapWaypointSiblings'
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
	const { wires, moveWaypoints, deleteWaypoints } = useMindmapContext()
	const { selectedWaypoints, addWaypointToSelection, removeWaypointFromSelection } =
		useMindmapSelectionContext()
	const ref = useRef<SVGGElement>(null)
	const selectedRef = useRef(false)
	const [currentState] = useState(() => ({
		x: waypoint.positionX,
		y: waypoint.positionY,
		grabX: 0,
		grabY: 0,
		group: new Set<string>(),
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
			removeWaypointFromSelection(waypoint.id)
		},
		[removeWaypointFromSelection, waypoint.id],
	)

	const moveTo = (point: Point) => {
		currentState.x = point.x
		currentState.y = point.y
		ref.current?.setAttribute('transform', `translate(${point.x} ${point.y})`)
		onMove(index, point)
	}

	const getSiblingWaypoints = () => {
		return new Set([...selectedWaypoints.keys(), ...getMindmapWaypointSiblings(wires, waypoint.id)])
	}

	const dragTo = (point: Point) => {
		dispatchGlobalEvent['mindmap/waypoint/onGroupDragUpdate']({
			waypointIds: currentState.group,
			x: point.x + currentState.grabX,
			y: point.y + currentState.grabY,
		})
	}

	const onPointerDown = useMindmapWaypointDrag({
		onStart: (point) => {
			currentState.grabX = currentState.x - point.x
			currentState.grabY = currentState.y - point.y
			currentState.group = getSiblingWaypoints()
		},
		onMove: dragTo,
		onEnd: (point) => {
			dragTo(point)
			moveWaypoints({
				waypointIds: [...currentState.group],
				positionX: Math.round(currentState.x),
				positionY: Math.round(currentState.y),
			})
		},
	})

	useEventBusSubscribe['mindmap/waypoint/onGroupDragUpdate']({
		callback: ({ waypointIds, x, y }) => {
			if (waypointIds.has(waypoint.id)) {
				moveTo({ x, y })
			}
		},
	})

	const { triggerClick } = useDoubleClick<{ multiselect: boolean }>({
		onClick: ({ multiselect }) => {
			if (selectedRef.current) {
				removeWaypointFromSelection(waypoint.id)
			} else {
				addWaypointToSelection({ waypointId: waypoint.id, wireId, multiselect })
			}
		},
		onDoubleClick: () => deleteWaypoints([...getSiblingWaypoints()]),
		ignoreDelay: true,
	})

	return (
		<Box
			component="g"
			data-testid="MindmapWireWaypoint"
			ref={ref}
			transform={`translate(${waypoint.positionX} ${waypoint.positionY})`}
			onPointerDown={onPointerDown}
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
