import { RefObject, useEffect, useLayoutEffect, useState } from 'react'
import useEvent from 'react-use-event-hook'

import { useEventBusSubscribe } from '@/app/features/eventBus'
import { useMindmapContext } from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { MindmapWireParcel } from '@/app/views/world/views/mindmap/types'
import {
	nearestWirePoint,
	Point,
	toWireSegments,
	wireMidpoint,
} from '@/app/views/world/views/mindmap/workspace/content/wires/canvas/MindmapCanvasMath'
import { WirePaint } from '@/app/views/world/views/mindmap/workspace/content/wires/canvas/MindmapWireBuffer'
import { buildSvgBezierString } from '@/app/views/world/views/mindmap/workspace/content/wires/utils/buildSvgBezierString'
import { getEdgePoints } from '@/app/views/world/views/mindmap/workspace/content/wires/utils/getEdgePoints'
import { getNodeLayout } from '@/app/views/world/views/mindmap/workspace/content/wires/utils/getNodeLayout'

type Props = {
	wire: MindmapWireParcel
	containerRef: RefObject<HTMLDivElement | null>
	hitPathRef: RefObject<SVGPathElement | null>
}

export function useMindmapWireGeometry({
	wire: { wire, sourceNode, targetNode },
	containerRef,
	hitPathRef,
}: Props) {
	const { wireBuffer, wireGeometry, nodeLayouts } = useMindmapContext()

	const showSourceArrow = wire.direction === 'Reversed' || wire.direction === 'TwoWay'
	const showTargetArrow = wire.direction === 'Normal' || wire.direction === 'TwoWay'

	const [currentState] = useState(() => ({ waypoints: toPoints(wire), previewIndex: 0 }))

	const resolveSegments = () => {
		const endpoints = getEdgePoints(
			getNodeLayout(nodeLayouts, sourceNode.node),
			getNodeLayout(nodeLayouts, targetNode.node),
			currentState.waypoints,
		)
		return toWireSegments(endpoints, currentState.waypoints)
	}

	const [paint] = useState<WirePaint>(() => ({
		segments: resolveSegments(),
		hasSourceArrow: showSourceArrow,
		hasTargetArrow: showTargetArrow,
		sourceColor: 'transparent',
		midColor: 'transparent',
		targetColor: 'transparent',
		glowOpacity: 0.12,
		isActive: false,
	}))

	const updateDom = () => {
		const segments = resolveSegments()
		const curves = segments.map((segment) => segment.curve)
		hitPathRef.current?.setAttribute('d', curves.map(buildSvgBezierString).join(' '))
		const mid = wireMidpoint(curves)
		containerRef.current?.style.setProperty('--label-position-x', `${mid.x}px`)
		containerRef.current?.style.setProperty('--label-position-y', `${mid.y}px`)
		wireGeometry.set(wire.id, curves)

		paint.segments = segments
		paint.hasSourceArrow = showSourceArrow
		paint.hasTargetArrow = showTargetArrow
		wireBuffer.publish(wire.id, paint)
	}

	const moveWaypoint = useEvent((index: number, point: Point) => {
		currentState.waypoints[index] = point
		updateDom()
	})

	useEventBusSubscribe['mindmap/wire/onWaypointPreviewStart']({
		callback: ({ wireIds, position }) => {
			if (!wireIds.has(wire.id)) {
				return
			}
			currentState.previewIndex = nearestWirePoint(
				paint.segments.map((segment) => segment.curve),
				position,
			).index
			currentState.waypoints.splice(currentState.previewIndex, 0, position)
			updateDom()
		},
	})
	useEventBusSubscribe['mindmap/wire/onWaypointPreviewMove']({
		callback: ({ wireIds, position }) => {
			if (wireIds.has(wire.id)) {
				moveWaypoint(currentState.previewIndex, position)
			}
		},
	})

	const onNodeLayoutChanged = useEvent(updateDom)
	useLayoutEffect(() => {
		const offSource = nodeLayouts.subscribe(sourceNode.node.id, onNodeLayoutChanged)
		const offTarget = nodeLayouts.subscribe(targetNode.node.id, onNodeLayoutChanged)
		return () => {
			offSource()
			offTarget()
		}
	}, [nodeLayouts, sourceNode.node.id, targetNode.node.id, onNodeLayoutChanged])

	useLayoutEffect(() => {
		currentState.waypoints = toPoints(wire)
		updateDom()
	})

	useEffect(
		() => () => {
			wireGeometry.delete(wire.id)
			wireBuffer.remove(wire.id)
		},
		[wire.id, wireBuffer, wireGeometry],
	)

	return { paint, moveWaypoint }
}

function toPoints(wire: MindmapWireParcel['wire']): Point[] {
	return wire.waypoints.map((waypoint) => ({ x: waypoint.positionX, y: waypoint.positionY }))
}
