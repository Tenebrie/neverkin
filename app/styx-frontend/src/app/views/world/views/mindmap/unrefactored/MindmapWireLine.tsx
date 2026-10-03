import Box from '@mui/material/Box'
import { alpha, lighten } from '@mui/material/styles'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch } from 'react-redux'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { useEventBusSubscribe } from '@/app/features/eventBus'
import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { useDoubleClick } from '@/app/hooks/useDoubleClick'
import { useDraggableClick } from '@/app/hooks/useDraggableClick'

import { useMindmapContext, useMindmapWire } from '../context/useMindmapContext'
import { mindmapSlice } from '../MindmapSlice'
import { MindmapNodeParentParcel, MindmapWireParcel } from '../types'
import { MindmapWireLabel } from '../workspace/content/wires/label/MindmapWireLabel'
import {
	buildPathD,
	getNodeHeight,
	nodePositions,
	pathMidpoint,
	pickEdgePoints,
	registerWire,
	unregisterWire,
	WireEndpoints,
	WirePaint,
} from './mindmapWireUtils'

type Props = {
	wireId: string
	svgGroupPortal: SVGGElement
	onOpenPopover: (position: { x: number; y: number }, mode: 'doubleClick' | 'contextMenu') => void
}

type WireProps = Omit<Props, 'wireId'> & {
	wire: MindmapWireParcel
	source: {
		node: MindmapNode
		parent: MindmapNodeParentParcel
	}
	target: {
		node: MindmapNode
		parent: MindmapNodeParentParcel
	}
}

type WireHighlightState = 'none' | 'brightGradient' | 'brightSource' | 'brightTarget' | 'dim'

/**
 * Subscribes to this one wire in the content store, so an edit elsewhere on the mindmap never
 * reaches this component.
 */
export function MindmapWireLine({ wireId, ...props }: Props) {
	const boxedWire = useMindmapWire(wireId)
	if (!boxedWire) {
		return null
	}

	return (
		<MindmapWireLineComponent
			{...props}
			wire={boxedWire}
			source={boxedWire.sourceNode}
			target={boxedWire.targetNode}
		/>
	)
}

function MindmapWireLineComponent({
	wire: boxedWire,
	source,
	target,
	svgGroupPortal,
	onOpenPopover,
}: WireProps) {
	const { wire } = boxedWire
	const { wireBuffer } = useMindmapContext()
	const containerRef = useRef<HTMLDivElement>(null)
	const hitPathRef = useRef<SVGPathElement>(null)

	const posRef = useRef({
		srcX: source.node.positionX,
		srcY: source.node.positionY,
		tgtX: target.node.positionX,
		tgtY: target.node.positionY,
	})

	const showSourceArrow = wire.direction === 'Reversed' || wire.direction === 'TwoWay'
	const showTargetArrow = wire.direction === 'Normal' || wire.direction === 'TwoWay'

	const updateDom = (ep: WireEndpoints) => {
		hitPathRef.current?.setAttribute('d', buildPathD(ep))
		const mid = pathMidpoint(ep)
		containerRef.current?.style.setProperty('--label-position-x', `${mid.x}px`)
		containerRef.current?.style.setProperty('--label-position-y', `${mid.y}px`)
		registerWire(wire.id, ep)

		const paint = paintRef.current
		paint.endpoints = ep
		paint.hasSourceArrow = showSourceArrow
		paint.hasTargetArrow = showTargetArrow
		wireBuffer.publish(wire.id, paint)
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
			if (!hitPathRef.current) return
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

	const paintRef = useRef<WirePaint>({
		endpoints: ep,
		hasSourceArrow: showSourceArrow,
		hasTargetArrow: showTargetArrow,
		sourceColor: 'transparent',
		midColor: 'transparent',
		targetColor: 'transparent',
		glowOpacity: 0.12,
		isActive: false,
	})

	const isHoveredRef = useRef(false)
	const isActiveRef = useRef(false)
	const selectedRef = useRef(false)
	const highlightStateRef = useRef<WireHighlightState>('none')

	useLayoutEffect(() => {
		updateDom(resolveEndpoints())
		applyHighlightState()
	})
	useEffect(
		() => () => {
			unregisterWire(wire.id)
			wireBuffer.remove(wire.id)
		},
		[wire.id, wireBuffer],
	)

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

		const paint = paintRef.current
		paint.glowOpacity = isSel ? 0.7 : isHov || isAct ? 0.4 : 0.12
		paint.isActive = isAct
		wireBuffer.publish(wire.id, paint)
	}, [wire.id, wireBuffer])

	useEventBusSubscribe['mindmap/selection/changed']({
		callback: ({ selectedWireIds }) => {
			selectedRef.current = selectedWireIds.has(wire.id)
			applyVisualState()
		},
	})

	const applyHighlightState = () => {
		const highlightState = highlightStateRef.current
		const { sourceColor, targetColor } = getLineColors(highlightState)
		const paint = paintRef.current
		paint.sourceColor = sourceColor
		paint.midColor = `color-mix(in oklch shorter hue, ${sourceColor}, ${targetColor})`
		paint.targetColor = targetColor
		wireBuffer.publish(wire.id, paint)
		containerRef.current?.style.setProperty('opacity', String(highlightState === 'dim' ? 0.35 : 1))
	}

	const setHighlightState = (highlightState: WireHighlightState) => {
		if (highlightStateRef.current === highlightState) {
			return
		}
		highlightStateRef.current = highlightState
		applyHighlightState()
	}

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

	const getLineColors = (highlightState: WireHighlightState) => {
		const alwaysShowColor = true
		const baseColor = lighten(theme.custom.palette.background.timeline, 0.2)
		const sourceParentColor = source.parent.color ?? baseColor
		const targetParentColor = target.parent.color ?? baseColor

		if (highlightState === 'dim') {
			return {
				sourceColor: alpha(baseColor, 0.5),
				targetColor: alpha(baseColor, 0.5),
			}
		}

		if (highlightState === 'brightSource') {
			return {
				sourceColor: targetParentColor,
				targetColor: targetParentColor,
			}
		}

		if (highlightState === 'brightTarget') {
			return {
				sourceColor: sourceParentColor,
				targetColor: sourceParentColor,
			}
		}

		if (highlightState === 'brightGradient' && alwaysShowColor) {
			return {
				sourceColor: targetParentColor,
				targetColor: sourceParentColor,
			}
		} else if (highlightState === 'brightGradient') {
			return {
				sourceColor: sourceParentColor,
				targetColor: targetParentColor,
			}
		}

		if (alwaysShowColor) {
			return {
				sourceColor: targetParentColor,
				targetColor: sourceParentColor,
			}
		}

		return {
			sourceColor: baseColor,
			targetColor: baseColor,
		}
	}

	return (
		<Box
			ref={containerRef}
			sx={{
				'--label-position-x': `${pathMidpoint(ep).x}px`,
				'--label-position-y': `${pathMidpoint(ep).y}px`,
			}}
		>
			{createPortal(
				<>
					{/* Invisible fat hit area for pointer events; the visible wire is drawn by MindmapWireCanvas */}
					<path
						data-testid="MindmapWire"
						ref={hitPathRef}
						d={buildPathD(ep)}
						fill="none"
						stroke="none"
						strokeWidth={16}
						pointerEvents="stroke"
						style={{ cursor: 'pointer', visibility: 'hidden' }}
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
