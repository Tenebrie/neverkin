import Box from '@mui/material/Box'
import { alpha, lighten } from '@mui/material/styles'
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch } from 'react-redux'

import { MindmapNode, MindmapWire } from '@/api/types/mindmapTypes'
import { useEventBusSubscribe } from '@/app/features/eventBus'
import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { useDoubleClick } from '@/app/hooks/useDoubleClick'
import { useDraggableClick } from '@/app/hooks/useDraggableClick'

import { BoxedMindmapParent } from '../hooks/useBoxedMindmapContent'
import { mindmapSlice } from '../MindmapSlice'
import { MindmapWireLabel } from './MindmapWireLabel'
import {
	arrowPath,
	buildPathD,
	getNodeHeight,
	nodePositions,
	pathMidpoint,
	pickEdgePoints,
	registerWire,
	unregisterWire,
	WireEndpoints,
} from './mindmapWireUtils'

type Props = {
	wire: MindmapWire
	source: {
		node: MindmapNode
		parent: BoxedMindmapParent
	}
	target: {
		node: MindmapNode
		parent: BoxedMindmapParent
	}
	svgDefsPortal: SVGDefsElement
	svgGroupPortal: SVGGElement
	onOpenPopover: (position: { x: number; y: number }, mode: 'doubleClick' | 'contextMenu') => void
}

const ARROW_SIZE = 8
const SHAPE_TRANSITION = 'fill 0.25s ease, stroke 0.25s ease'

export const MindmapWireLine = memo(MindmapWireLineComponent)

function MindmapWireLineComponent({
	wire,
	source,
	target,
	svgDefsPortal,
	svgGroupPortal,
	onOpenPopover,
}: Props) {
	const [highlightState, setHighlightState] = useState<
		'none' | 'brightGradient' | 'brightSource' | 'brightTarget' | 'dim'
	>('none')

	const containerRef = useRef<HTMLDivElement>(null)
	const pathRef = useRef<SVGPathElement>(null)
	const glowPathRef = useRef<SVGPathElement>(null)
	const hitPathRef = useRef<SVGPathElement>(null)
	const gradientRef = useRef<SVGLinearGradientElement>(null)
	const srcPortRef = useRef<SVGGElement>(null)
	const tgtPortRef = useRef<SVGGElement>(null)
	const srcArrowRef = useRef<SVGPathElement>(null)
	const tgtArrowRef = useRef<SVGPathElement>(null)
	const visibleGroupRef = useRef<SVGGElement>(null)

	const gradientId = `link-gradient-${source.node.id}-${target.node.id}`

	const posRef = useRef({
		srcX: source.node.positionX,
		srcY: source.node.positionY,
		tgtX: target.node.positionX,
		tgtY: target.node.positionY,
	})

	const showSourceArrow = wire.direction === 'Reversed' || wire.direction === 'TwoWay'
	const showTargetArrow = wire.direction === 'Normal' || wire.direction === 'TwoWay'

	const updateDom = (ep: WireEndpoints) => {
		const d = buildPathD(ep)
		pathRef.current?.setAttribute('d', d)
		glowPathRef.current?.setAttribute('d', d)
		hitPathRef.current?.setAttribute('d', d)
		gradientRef.current?.setAttribute('x1', String(ep.x1))
		gradientRef.current?.setAttribute('y1', String(ep.y1))
		gradientRef.current?.setAttribute('x2', String(ep.x2))
		gradientRef.current?.setAttribute('y2', String(ep.y2))
		srcPortRef.current?.setAttribute('transform', `translate(${ep.x1}, ${ep.y1})`)
		tgtPortRef.current?.setAttribute('transform', `translate(${ep.x2}, ${ep.y2})`)
		if (showSourceArrow) {
			srcArrowRef.current?.setAttribute('d', arrowPath(ep.x1, ep.y1, -ep.nx1, -ep.ny1, ARROW_SIZE))
		}
		if (showTargetArrow) {
			tgtArrowRef.current?.setAttribute('d', arrowPath(ep.x2, ep.y2, -ep.nx2, -ep.ny2, ARROW_SIZE))
		}
		const mid = pathMidpoint(ep)
		containerRef.current?.setAttribute(
			'style',
			`--label-position-x: ${mid.x}px; --label-position-y: ${mid.y}px`,
		)
		registerWire(wire.id, ep)
	}

	/**
	 * Live node positions are authoritative — they follow a drag in progress, while the props only
	 * catch up once the move is committed. Props are the fallback for nodes that aren't mounted.
	 */
	const resolveEndpoints = (): WireEndpoints => {
		const srcPos = nodePositions.get(source.node.id)
		const tgtPos = nodePositions.get(target.node.id)
		const pos = posRef.current
		pos.srcX = srcPos?.x ?? source.node.positionX
		pos.srcY = srcPos?.y ?? source.node.positionY
		pos.tgtX = tgtPos?.x ?? target.node.positionX
		pos.tgtY = tgtPos?.y ?? target.node.positionY
		return pickEdgePoints(
			pos.srcX,
			pos.srcY,
			srcPos?.height ?? getNodeHeight(source.node.id),
			pos.tgtX,
			pos.tgtY,
			tgtPos?.height ?? getNodeHeight(target.node.id),
		)
	}

	useEventBusSubscribe['mindmap/node/onMove']({
		callback: () => {
			if (!pathRef.current || !gradientRef.current) return
			const pos = posRef.current
			const srcPos = nodePositions.get(source.node.id)
			const tgtPos = nodePositions.get(target.node.id)
			if (!srcPos || !tgtPos) return
			if (pos.srcX === srcPos.x && pos.srcY === srcPos.y && pos.tgtX === tgtPos.x && pos.tgtY === tgtPos.y)
				return
			updateDom(resolveEndpoints())
		},
	})

	const ep = resolveEndpoints()
	const { x1, y1, x2, y2, nx1, ny1, nx2, ny2 } = ep

	const isHoveredRef = useRef(false)
	const isActiveRef = useRef(false)
	const selectedRef = useRef(false)

	useLayoutEffect(() => {
		updateDom(resolveEndpoints())
	})
	useEffect(() => () => unregisterWire(wire.id), [wire.id])

	const { addWireToSelection, removeWireFromSelection } = mindmapSlice.actions
	const { addWireToHover, removeWireFromHover } = mindmapSlice.actions
	const dispatch = useDispatch()

	const { triggerClick } = useDoubleClick<{ multiselect: boolean; event: React.MouseEvent }>({
		onClick: ({ multiselect }) => {
			if (selectedRef.current) {
				dispatch(removeWireFromSelection(wire.id))
			} else {
				dispatch(addWireToSelection({ wireId: wire.id, multiselect }))
			}
		},
		onDoubleClick: ({ event, multiselect }) => {
			onOpenPopover({ x: event.clientX, y: event.clientY }, 'doubleClick')
			dispatch(addWireToSelection({ wireId: wire.id, multiselect }))
		},
		ignoreDelay: true,
	})

	const { onMouseDown, onMouseUp } = useDraggableClick({
		onRightClick: (event) => {
			onOpenPopover({ x: event.clientX, y: event.clientY }, 'contextMenu')
			dispatch(addWireToSelection({ wireId: wire.id, multiselect: event.shiftKey }))
		},
	})

	const applyVisualState = useCallback(() => {
		const isSel = selectedRef.current
		const isHov = isHoveredRef.current
		const isAct = isActiveRef.current

		const glowOpacity = isSel ? '0.7' : isHov || isAct ? '0.4' : '0.12'
		const brightness = isAct ? 'brightness(0.85)' : 'none'

		glowPathRef.current?.style.setProperty('opacity', glowOpacity)
		visibleGroupRef.current?.style.setProperty('filter', brightness)
	}, [])

	useEventBusSubscribe['mindmap/selection/changed']({
		callback: ({ selectedWireIds }) => {
			selectedRef.current = selectedWireIds.has(wire.id)
			applyVisualState()
		},
	})
	useEventBusSubscribe['mindmap/hover/changed']({
		callback: ({ hoveredNodeIds, hoveredWireIds }) => {
			if (hoveredWireIds.has(wire.id)) {
				setHighlightState('brightGradient')
			} else if (hoveredNodeIds.has(source.node.id)) {
				setHighlightState('brightSource')
			} else if (hoveredNodeIds.has(target.node.id)) {
				setHighlightState('brightTarget')
			} else if (hoveredNodeIds.size > 0) {
				setHighlightState('dim')
			} else {
				setHighlightState('none')
			}
		},
	})

	const theme = useCustomTheme()
	const opacity = useMemo(() => {
		if (highlightState === 'dim') {
			return 0.35
		}
		return 1
	}, [highlightState])

	const { sourceColor, targetColor } = useMemo(() => {
		const alwaysShowColor = true
		const baseColor = lighten(theme.custom.palette.background.timeline, 0.2)

		if (highlightState === 'dim') {
			return {
				sourceColor: alpha(baseColor, 0.5),
				targetColor: alpha(baseColor, 0.5),
			}
		}

		if (highlightState === 'brightSource') {
			return {
				sourceColor: target.parent.color,
				targetColor: target.parent.color,
			}
		}

		if (highlightState === 'brightTarget') {
			return {
				sourceColor: source.parent.color,
				targetColor: source.parent.color,
			}
		}

		if (highlightState === 'brightGradient' && alwaysShowColor) {
			return {
				sourceColor: target.parent.color,
				targetColor: source.parent.color,
			}
		} else if (highlightState === 'brightGradient') {
			return {
				sourceColor: source.parent.color,
				targetColor: target.parent.color,
			}
		}

		if (alwaysShowColor) {
			return {
				sourceColor: target.parent.color,
				targetColor: source.parent.color,
			}
		}

		return {
			sourceColor: baseColor,
			targetColor: baseColor,
		}
	}, [highlightState, source.parent.color, target.parent.color, theme.custom.palette.background.timeline])

	const midColor = `color-mix(in oklch shorter hue, ${sourceColor}, ${targetColor})`

	return (
		<Box
			ref={containerRef}
			sx={{
				opacity,
				zIndex: 100,
				transition: 'opacity 0.2s',
				'--label-position-x': `${pathMidpoint(ep).x}px`,
				'--label-position-y': `${pathMidpoint(ep).y}px`,
			}}
		>
			{createPortal(
				<linearGradient
					ref={gradientRef}
					id={gradientId}
					gradientUnits="userSpaceOnUse"
					x1={x1}
					y1={y1}
					x2={x2}
					y2={y2}
				>
					<stop offset="0%" style={{ stopColor: sourceColor, transition: 'stop-color 0.25s ease' }} />
					<stop offset="50%" style={{ stopColor: midColor, transition: 'stop-color 0.25s ease' }} />
					<stop offset="100%" style={{ stopColor: targetColor, transition: 'stop-color 0.25s ease' }} />
				</linearGradient>,
				svgDefsPortal,
			)}
			{createPortal(
				<>
					{/* Glow stroke — wider path behind, toggled via opacity */}
					<path
						ref={glowPathRef}
						d={buildPathD(ep)}
						fill="none"
						strokeWidth={8}
						pointerEvents="none"
						style={{ stroke: `url(#${gradientId})`, opacity: 0.12, transition: 'opacity 0.25s ease' }}
					/>
					<g
						ref={visibleGroupRef}
						style={{
							transition: 'filter 0.25s ease',
						}}
					>
						<path
							ref={pathRef}
							data-mindmap-wire={wire.id}
							d={buildPathD(ep)}
							fill="none"
							pointerEvents="none"
							strokeWidth={2}
							style={{ stroke: `url(#${gradientId})` }}
						/>
						{!showSourceArrow && (
							<g ref={srcPortRef} transform={`translate(${x1}, ${y1})`}>
								<circle
									cx="0"
									cy="0"
									r="3"
									strokeWidth="2"
									style={{
										fill: sourceColor,
										stroke: sourceColor,
										transition: SHAPE_TRANSITION,
									}}
								/>
							</g>
						)}
						{!showTargetArrow && (
							<g ref={tgtPortRef} transform={`translate(${x2}, ${y2})`}>
								<circle
									cx="0"
									cy="0"
									r="3"
									strokeWidth="2"
									style={{
										fill: targetColor,
										stroke: targetColor,
										transition: SHAPE_TRANSITION,
									}}
								/>
							</g>
						)}
						{showSourceArrow && (
							<path
								ref={srcArrowRef}
								d={arrowPath(x1, y1, -nx1, -ny1, ARROW_SIZE)}
								fill="none"
								strokeWidth={2}
								strokeLinecap="round"
								strokeLinejoin="round"
								pointerEvents="none"
								style={{ stroke: targetColor, transition: SHAPE_TRANSITION }}
							/>
						)}
						{showTargetArrow && (
							<path
								ref={tgtArrowRef}
								d={arrowPath(x2, y2, -nx2, -ny2, ARROW_SIZE)}
								fill="none"
								strokeWidth={2}
								strokeLinecap="round"
								strokeLinejoin="round"
								pointerEvents="none"
								style={{ stroke: targetColor, transition: SHAPE_TRANSITION }}
							/>
						)}
					</g>
					{/* Invisible fat hit area for pointer events */}
					<path
						data-testid="MindmapWire"
						ref={hitPathRef}
						d={buildPathD(ep)}
						fill="none"
						stroke="transparent"
						strokeWidth={16}
						pointerEvents="auto"
						style={{ cursor: 'pointer' }}
						onClick={(event) => triggerClick(event, { multiselect: event.shiftKey, event })}
						onMouseEnter={() => {
							isHoveredRef.current = true
							dispatch(addWireToHover(wire.id))
							applyVisualState()
						}}
						onMouseLeave={() => {
							isHoveredRef.current = false
							isActiveRef.current = false
							dispatch(removeWireFromHover(wire.id))
							applyVisualState()
						}}
						onMouseDown={() => {
							isActiveRef.current = true
							applyVisualState()
							onMouseDown()
						}}
						onMouseUp={(event) => {
							isActiveRef.current = false
							applyVisualState()
							onMouseUp(event)
						}}
					/>
				</>,
				svgGroupPortal,
			)}
			{wire.content && (
				<MindmapWireLabel
					wire={wire}
					onMouseDown={onMouseDown}
					onMouseUp={onMouseUp}
					onClick={(event) => triggerClick(event, { multiselect: event.shiftKey, event })}
				/>
			)}
		</Box>
	)
}
