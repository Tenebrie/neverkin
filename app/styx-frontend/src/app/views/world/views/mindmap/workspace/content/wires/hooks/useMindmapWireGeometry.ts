import { RefObject, useEffect, useLayoutEffect, useState } from 'react'
import useEvent from 'react-use-event-hook'

import { useMindmapContext } from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { MindmapWireParcel } from '@/app/views/world/views/mindmap/types'
import {
	midpointOf,
	toControlPoints,
} from '@/app/views/world/views/mindmap/workspace/content/wires/canvas/MindmapCanvasMath'
import {
	WireEndpoints,
	WirePaint,
} from '@/app/views/world/views/mindmap/workspace/content/wires/canvas/MindmapWireBuffer'
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

	const resolveEndpoints = (): WireEndpoints => {
		return getEdgePoints(
			getNodeLayout(nodeLayouts, sourceNode.node),
			getNodeLayout(nodeLayouts, targetNode.node),
		)
	}

	const [paint] = useState<WirePaint>(() => {
		const endpoints = resolveEndpoints()
		return {
			endpoints,
			curve: toControlPoints(endpoints),
			hasSourceArrow: showSourceArrow,
			hasTargetArrow: showTargetArrow,
			sourceColor: 'transparent',
			midColor: 'transparent',
			targetColor: 'transparent',
			glowOpacity: 0.12,
			isActive: false,
		}
	})

	const updateDom = (ep: WireEndpoints) => {
		const curve = toControlPoints(ep)
		hitPathRef.current?.setAttribute('d', buildSvgBezierString(curve))
		const mid = midpointOf(curve)
		containerRef.current?.style.setProperty('--label-position-x', `${mid.x}px`)
		containerRef.current?.style.setProperty('--label-position-y', `${mid.y}px`)
		wireGeometry.set(wire.id, curve)

		paint.endpoints = ep
		paint.curve = curve
		paint.hasSourceArrow = showSourceArrow
		paint.hasTargetArrow = showTargetArrow
		wireBuffer.publish(wire.id, paint)
	}

	const onNodeLayoutChanged = useEvent(() => updateDom(resolveEndpoints()))
	useLayoutEffect(() => {
		const offSource = nodeLayouts.subscribe(sourceNode.node.id, onNodeLayoutChanged)
		const offTarget = nodeLayouts.subscribe(targetNode.node.id, onNodeLayoutChanged)
		return () => {
			offSource()
			offTarget()
		}
	}, [nodeLayouts, sourceNode.node.id, targetNode.node.id, onNodeLayoutChanged])

	useLayoutEffect(() => {
		updateDom(resolveEndpoints())
	})

	useEffect(
		() => () => {
			wireGeometry.delete(wire.id)
			wireBuffer.remove(wire.id)
		},
		[wire.id, wireBuffer, wireGeometry],
	)

	return paint
}
