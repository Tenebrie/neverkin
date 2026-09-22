import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from 'react-redux'

import { IsDragDropStateOfType } from '@/app/features/dragDrop/DragDropState'
import { useDragDropBusSubscribe } from '@/app/features/dragDrop/hooks/useDragDropBus'
import { dispatchGlobalEvent, useEventBusSubscribe } from '@/app/features/eventBus'
import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { useMousePositionRef } from '@/app/hooks/useMousePositionRef'
import { RootState } from '@/app/store'

import { useMindmapExistingWires } from '../hooks/useMindmapContentStore'
import { getSelectedNodeKeys } from '../MindmapSliceSelectors'
import { getMindmapGridPosition } from '../utils/getMindmapGridPosition'
import { isEmptyMindmapSpot } from '../utils/isEmptyMindmapSpot'
import { MindmapState } from '../utils/MindmapState'
import {
	buildPathD,
	getNodeHeight,
	isPointInsideNode,
	nearestEdgePoint,
	NODE_W,
	pickEdgePoints,
	WireEndpoints,
} from './mindmapWireUtils'

type SourceNode = {
	id: string
	positionX: number
	positionY: number
}

export function MindmapWireGhost() {
	const existingWires = useMindmapExistingWires()
	const [isDragging, setIsDragging] = useState(false)
	const [awaitingSelection, setAwaitingSelection] = useState(false)
	const [sourceNodes, setSourceNodes] = useState<SourceNode[]>([])
	const containerRef = useRef<SVGGElement>(null)
	const theme = useCustomTheme()
	const store = useStore<RootState>()

	const mousePos = useMousePositionRef()

	const ghostState = useRef({ isDragging, awaitingSelection, sourceNodes })
	ghostState.current = { isDragging, awaitingSelection, sourceNodes }

	// Escape and right click cancel the drag without a left button release
	const dropButton = useRef<number | null>(null)
	useEffect(() => {
		if (!isDragging || awaitingSelection) {
			return
		}

		const onMouseUp = (event: MouseEvent) => {
			dropButton.current = event.button
		}

		window.addEventListener('mouseup', onMouseUp)
		return () => {
			window.removeEventListener('mouseup', onMouseUp)
		}
	}, [awaitingSelection, isDragging])

	const clearGhost = useCallback(() => {
		setIsDragging(false)
		setAwaitingSelection(false)
		setSourceNodes([])
	}, [])

	useEventBusSubscribe['quickSelect/onClosed']({
		condition: () => ghostState.current.awaitingSelection,
		callback: clearGhost,
	})

	useDragDropBusSubscribe({
		callback: useCallback(
			(dragState) => {
				if (!IsDragDropStateOfType(dragState, 'actorNodeLinking')) {
					if (ghostState.current.awaitingSelection) {
						return
					}
					if (
						ghostState.current.isDragging &&
						dropButton.current === 0 &&
						isEmptyMindmapSpot({ screenX: mousePos.current.x, screenY: mousePos.current.y })
					) {
						setAwaitingSelection(true)
						dispatchGlobalEvent['quickSelect/requestOpen']({
							query: '',
							screenPosTop: mousePos.current.y,
							screenPosBottom: mousePos.current.y,
							screenPosLeft: mousePos.current.x,
						})
						dispatchGlobalEvent['mindmap/wire/requestNodeTarget']({
							sourceNodeIds: ghostState.current.sourceNodes.map((node) => node.id),
						})
						return
					}
					setIsDragging(false)
					return
				}
				setIsDragging(true)
				dropButton.current = null

				const selectedKeys = getSelectedNodeKeys(store.getState())
				const sourceId = dragState.params.sourceNode.id

				if (selectedKeys.includes(sourceId)) {
					const nodes: SourceNode[] = []
					for (const key of selectedKeys) {
						const el = document.querySelector(`[data-mindmap-node="${key}"]`) as HTMLElement | null
						if (!el) continue
						nodes.push({
							id: key,
							positionX: parseFloat(el.style.getPropertyValue('--node-x')),
							positionY: parseFloat(el.style.getPropertyValue('--node-y')),
						})
					}
					setSourceNodes(
						nodes.length > 0
							? nodes
							: [
									{
										id: sourceId,
										positionX: dragState.params.sourceNode.positionX,
										positionY: dragState.params.sourceNode.positionY,
									},
								],
					)
				} else {
					setSourceNodes([
						{
							id: sourceId,
							positionX: dragState.params.sourceNode.positionX,
							positionY: dragState.params.sourceNode.positionY,
						},
					])
				}
			},
			[mousePos, store],
		),
	})

	const strokeColorStart = theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
	const strokeColorEnd = theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
	const snapColorStart = theme.mode === 'dark' ? 'rgba(100, 180, 255, 0.9)' : 'rgba(30, 100, 200, 0.9)'
	const snapColorEnd = theme.mode === 'dark' ? 'rgba(100, 180, 255, 0.4)' : 'rgba(30, 100, 200, 0.4)'
	const duplicateColorStart = theme.mode === 'dark' ? 'rgba(255, 100, 100, 0.9)' : 'rgba(200, 30, 30, 0.9)'
	const duplicateColorEnd = theme.mode === 'dark' ? 'rgba(255, 100, 100, 0.4)' : 'rgba(200, 30, 30, 0.4)'

	useEffect(() => {
		if (!isDragging || awaitingSelection || sourceNodes.length === 0) {
			return
		}

		const sourceNodeIds = new Set(sourceNodes.map((n) => n.id))

		const updateWireDom = (
			wireGroup: Element,
			gradientEl: Element | null,
			ep: WireEndpoints,
			colorStart: string,
			colorEnd: string,
		) => {
			const pathEl = wireGroup.querySelector('path')
			const srcPortEl = wireGroup.querySelector('[data-src-port]')

			pathEl?.setAttribute('d', buildPathD(ep))
			gradientEl?.setAttribute('x1', String(ep.x1))
			gradientEl?.setAttribute('y1', String(ep.y1))
			gradientEl?.setAttribute('x2', String(ep.x2))
			gradientEl?.setAttribute('y2', String(ep.y2))
			const stops = gradientEl?.querySelectorAll('stop')
			if (stops) {
				stops[0]?.setAttribute('stop-color', colorEnd)
				stops[1]?.setAttribute('stop-color', colorStart)
				stops[2]?.setAttribute('stop-color', colorEnd)
			}
			srcPortEl?.querySelector('circle')?.setAttribute('fill', colorStart)
			srcPortEl?.querySelector('circle')?.setAttribute('stroke', colorStart)
			srcPortEl?.setAttribute('transform', `translate(${ep.x1}, ${ep.y1})`)
		}

		const handleMouseMove = (event: MouseEvent) => {
			const container = containerRef.current
			if (!container) {
				return
			}

			const mousePosition = getMindmapGridPosition({ screenX: event.clientX, screenY: event.clientY })
			if (!mousePosition) {
				return
			}

			const mouseGridX = mousePosition.x
			const mouseGridY = mousePosition.y

			// Find snap target
			const elementsUnder = document.elementsFromPoint(event.clientX, event.clientY)
			let snappedId: string | null = null
			let snappedX = 0
			let snappedY = 0
			let snappedH = 0
			for (const elem of elementsUnder) {
				const nodeElement = elem.closest('[data-mindmap-node]') as HTMLElement | null
				if (nodeElement) {
					const nodeId = nodeElement.getAttribute('data-mindmap-node')
					if (nodeId && !sourceNodeIds.has(nodeId)) {
						snappedX = parseFloat(nodeElement.style.getPropertyValue('--node-x'))
						snappedY = parseFloat(nodeElement.style.getPropertyValue('--node-y'))
						snappedH = getNodeHeight(nodeId)
						snappedId = nodeId
						break
					}
				}
			}

			for (const srcNode of sourceNodes) {
				const wireGroup = container.querySelector(`[data-ghost-wire="${srcNode.id}"]`)
				if (!wireGroup) continue

				const gradientEl = document.getElementById(`link-ghost-gradient-${srcNode.id}`)

				const srcX = srcNode.positionX
				const srcY = srcNode.positionY
				const srcH = getNodeHeight(srcNode.id)

				let ep: WireEndpoints
				let activeColorStart = strokeColorStart
				let activeColorEnd = strokeColorEnd

				if (!snappedId && isPointInsideNode(srcX, srcY, srcH, mouseGridX, mouseGridY)) {
					wireGroup.setAttribute('display', 'none')
					continue
				}
				wireGroup.setAttribute('display', 'inline')

				if (snappedId) {
					ep = pickEdgePoints(srcX, srcY, srcH, snappedX, snappedY, snappedH)
					const linkId = `${srcNode.id}->${snappedId}`
					const reverseLinkId = `${snappedId}->${srcNode.id}`
					if (existingWires.has(linkId) || existingWires.has(reverseLinkId)) {
						activeColorStart = duplicateColorStart
						activeColorEnd = duplicateColorEnd
					} else {
						activeColorStart = snapColorStart
						activeColorEnd = snapColorEnd
					}
				} else {
					const src = nearestEdgePoint(srcX, srcY, srcH, mouseGridX, mouseGridY)
					const srcCenterX = srcX + NODE_W / 2
					const srcCenterY = srcY + srcH / 2
					const dx = mouseGridX - srcCenterX
					const dy = mouseGridY - srcCenterY
					const len = Math.hypot(dx, dy) || 1

					ep = {
						x1: src.x,
						y1: src.y,
						x2: mouseGridX,
						y2: mouseGridY,
						nx1: src.nx,
						ny1: src.ny,
						nx2: -dx / len,
						ny2: -dy / len,
					}
				}

				updateWireDom(wireGroup, gradientEl, ep, activeColorStart, activeColorEnd)
			}
		}

		window.addEventListener('mousemove', handleMouseMove)
		return () => {
			window.removeEventListener('mousemove', handleMouseMove)
		}
	}, [
		awaitingSelection,
		existingWires,
		isDragging,
		sourceNodes,
		strokeColorStart,
		strokeColorEnd,
		snapColorStart,
		snapColorEnd,
		duplicateColorStart,
		duplicateColorEnd,
	])

	if (!isDragging || sourceNodes.length === 0) {
		return null
	}

	return (
		<svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
			<defs>
				{sourceNodes.map((node) => {
					const srcH = getNodeHeight(node.id)
					const src = nearestEdgePoint(
						node.positionX,
						node.positionY,
						srcH,
						node.positionX + NODE_W,
						node.positionY + srcH / 2,
					)
					return (
						<linearGradient
							key={node.id}
							id={`link-ghost-gradient-${node.id}`}
							gradientUnits="userSpaceOnUse"
							x1={src.x}
							y1={src.y}
							x2={src.x}
							y2={src.y}
						>
							<stop offset="0%" stopColor={strokeColorEnd}>
								<animate attributeName="offset" values="-0.30;1.0" dur="2s" repeatCount="indefinite" />
							</stop>
							<stop offset="0%" stopColor={strokeColorStart}>
								<animate attributeName="offset" values="-0.15;1.15" dur="2s" repeatCount="indefinite" />
							</stop>
							<stop offset="0%" stopColor={strokeColorEnd}>
								<animate attributeName="offset" values="-0.0;1.30" dur="2s" repeatCount="indefinite" />
							</stop>
						</linearGradient>
					)
				})}
			</defs>
			<g
				ref={containerRef}
				style={
					{
						'--grid-scale': MindmapState.scale,
						transform: `scale(var(--grid-scale))`,
						transformOrigin: '0 0',
						// transition: 'transform var(--transition-duration) ease-out',
					} as React.CSSProperties
				}
			>
				{sourceNodes.map((node) => {
					const srcH = getNodeHeight(node.id)
					const src = nearestEdgePoint(
						node.positionX,
						node.positionY,
						srcH,
						node.positionX + NODE_W,
						node.positionY + srcH / 2,
					)
					return (
						<g key={node.id} data-ghost-wire={node.id} display={'none'}>
							<path
								d={`M ${src.x},${src.y} C ${src.x},${src.y} ${src.x},${src.y} ${src.x},${src.y}`}
								fill="none"
								vectorEffect="non-scaling-stroke"
								style={{
									stroke: `url(#link-ghost-gradient-${node.id})`,
									strokeWidth: 2,
								}}
							/>
							<g data-src-port transform={`translate(${src.x}, ${src.y})`}>
								<circle cx="0" cy="0" r="4" fill={strokeColorStart} strokeWidth="0" />
							</g>
						</g>
					)
				})}
			</g>
		</svg>
	)
}
