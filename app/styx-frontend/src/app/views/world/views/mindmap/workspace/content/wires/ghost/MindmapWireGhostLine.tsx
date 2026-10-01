import { useId, useRef, useState } from 'react'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'

import {
	buildPathD,
	getNodeHeight,
	nearestEdgePoint,
	NODE_W,
	pickEdgePoints,
	WireEndpoints,
} from '../../../../unrefactored/mindmapWireUtils'
import { useMindmapWireGhostPainter } from './context/useMindmapWireGhostContext'

type Props = {
	node: MindmapNode
}

export function MindmapWireGhostLine({ node }: Props) {
	const gradientId = useId()
	const [height] = useState(() => getNodeHeight(node.id))
	const groupRef = useRef<SVGGElement>(null)
	const pathRef = useRef<SVGPathElement>(null)
	const gradientRef = useRef<SVGLinearGradientElement>(null)
	const portRef = useRef<SVGGElement>(null)
	const portCircleRef = useRef<SVGCircleElement>(null)
	const stopRefs = [useRef<SVGStopElement>(null), useRef<SVGStopElement>(null), useRef<SVGStopElement>(null)]
	const palette = useCustomTheme().custom.palette.wireGhost

	useMindmapWireGhostPainter(({ mouseX, mouseY, target, wirePairs }) => {
		const group = groupRef.current
		if (!group) {
			return
		}

		const left = node.positionX
		const right = left + NODE_W
		const top = node.positionY
		const bottom = node.positionY + height

		// Skip rendering when wire points inside self
		if (!target && mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom) {
			group.setAttribute('display', 'none')
			return
		}
		group.setAttribute('display', 'inline')

		let endpoints: WireEndpoints
		let colors = palette.free

		if (target) {
			endpoints = pickEdgePoints(node.positionX, node.positionY, height, target.x, target.y, target.height)
			const isDuplicate =
				wirePairs.has(`${node.id}->${target.id}`) || wirePairs.has(`${target.id}->${node.id}`)
			if (isDuplicate) {
				colors = palette.duplicate
			} else {
				colors = palette.snapped
			}
		} else {
			const source = nearestEdgePoint(node.positionX, node.positionY, height, mouseX, mouseY)
			const dx = mouseX - (node.positionX + NODE_W / 2)
			const dy = mouseY - (node.positionY + height / 2)
			const length = Math.hypot(dx, dy) || 1
			endpoints = {
				x1: source.x,
				y1: source.y,
				x2: mouseX,
				y2: mouseY,
				nx1: source.nx,
				ny1: source.ny,
				nx2: -dx / length,
				ny2: -dy / length,
			}
		}

		pathRef.current?.setAttribute('d', buildPathD(endpoints))
		gradientRef.current?.setAttribute('x1', String(endpoints.x1))
		gradientRef.current?.setAttribute('y1', String(endpoints.y1))
		gradientRef.current?.setAttribute('x2', String(endpoints.x2))
		gradientRef.current?.setAttribute('y2', String(endpoints.y2))
		stopRefs[0].current?.setAttribute('stop-color', colors.end)
		stopRefs[1].current?.setAttribute('stop-color', colors.start)
		stopRefs[2].current?.setAttribute('stop-color', colors.end)
		portCircleRef.current?.setAttribute('fill', colors.start)
		portRef.current?.setAttribute('transform', `translate(${endpoints.x1}, ${endpoints.y1})`)
	})

	return (
		<>
			<defs>
				<linearGradient ref={gradientRef} id={gradientId} gradientUnits="userSpaceOnUse">
					<stop ref={stopRefs[0]} offset="0%">
						<animate attributeName="offset" values="-0.30;1.0" dur="2s" repeatCount="indefinite" />
					</stop>
					<stop ref={stopRefs[1]} offset="0%">
						<animate attributeName="offset" values="-0.15;1.15" dur="2s" repeatCount="indefinite" />
					</stop>
					<stop ref={stopRefs[2]} offset="0%">
						<animate attributeName="offset" values="-0.0;1.30" dur="2s" repeatCount="indefinite" />
					</stop>
				</linearGradient>
			</defs>
			<g ref={groupRef} display="none">
				<path
					ref={pathRef}
					fill="none"
					vectorEffect="non-scaling-stroke"
					style={{ stroke: `url("#${gradientId}")`, strokeWidth: 2 }}
				/>
				<g ref={portRef}>
					<circle ref={portCircleRef} r="4" strokeWidth="0" />
				</g>
			</g>
		</>
	)
}
