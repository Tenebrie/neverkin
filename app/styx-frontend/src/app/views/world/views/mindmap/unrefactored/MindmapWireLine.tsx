import Box from '@mui/material/Box'
import { alpha, lighten } from '@mui/material/styles'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch } from 'react-redux'
import useEvent from 'react-use-event-hook'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { useEventBusSubscribe } from '@/app/features/eventBus'
import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { useDoubleClick } from '@/app/hooks/useDoubleClick'
import { useDraggableClick } from '@/app/hooks/useDraggableClick'

import { useMindmapContext, useMindmapWire } from '../context/useMindmapContext'
import { mindmapSlice } from '../MindmapSlice'
import { MindmapNodeParentParcel, MindmapWireParcel } from '../types'
import { midpointOf, toControlPoints } from '../workspace/content/wires/canvas/MindmapCanvasMath'
import { MindmapWireLabel } from '../workspace/content/wires/label/MindmapWireLabel'
import { buildPathD, pickEdgePoints, resolveNodeLayout, WireEndpoints, WirePaint } from './mindmapWireUtils'

type Props = {
	wireId: string
	svgGroupPortal: SVGGElement
	onOpenPopover: (position: { x: number; y: number }, mode: 'doubleClick' | 'contextMenu') => void
}

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

type WireHighlightState = 'none' | 'brightGradient' | 'brightSource' | 'brightTarget' | 'dim'

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

function MindmapWireLineComponent({
	wire: boxedWire,
	source,
	target,
	svgGroupPortal,
	onOpenPopover,
}: WireProps) {
	const { wire } = boxedWire
	const { wireBuffer, wireGeometry, nodeLayouts } = useMindmapContext()
	const containerRef = useRef<HTMLDivElement>(null)
	const hitPathRef = useRef<SVGPathElement>(null)

	const showSourceArrow = wire.direction === 'Reversed' || wire.direction === 'TwoWay'
	const showTargetArrow = wire.direction === 'Normal' || wire.direction === 'TwoWay'

	const updateDom = (ep: WireEndpoints) => {
		const curve = toControlPoints(ep)
		hitPathRef.current?.setAttribute('d', buildPathD(curve))
		const mid = midpointOf(curve)
		containerRef.current?.style.setProperty('--label-position-x', `${mid.x}px`)
		containerRef.current?.style.setProperty('--label-position-y', `${mid.y}px`)
		wireGeometry.set(wire.id, curve)

		const paint = paintRef.current
		paint.endpoints = ep
		paint.curve = curve
		paint.hasSourceArrow = showSourceArrow
		paint.hasTargetArrow = showTargetArrow
		wireBuffer.publish(wire.id, paint)
	}

	const resolveEndpoints = (): WireEndpoints => {
		return pickEdgePoints(
			resolveNodeLayout(nodeLayouts, source.node),
			resolveNodeLayout(nodeLayouts, target.node),
		)
	}

	const onNodeLayoutChanged = useEvent(() => updateDom(resolveEndpoints()))
	useLayoutEffect(() => {
		const offSource = nodeLayouts.subscribe(source.node.id, onNodeLayoutChanged)
		const offTarget = nodeLayouts.subscribe(target.node.id, onNodeLayoutChanged)
		return () => {
			offSource()
			offTarget()
		}
	}, [nodeLayouts, source.node.id, target.node.id, onNodeLayoutChanged])

	const ep = resolveEndpoints()

	const paintRef = useRef<WirePaint>({
		endpoints: ep,
		curve: toControlPoints(ep),
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
			wireGeometry.delete(wire.id)
			wireBuffer.remove(wire.id)
		},
		[wire.id, wireBuffer, wireGeometry],
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
		<Box ref={containerRef}>
			{createPortal(
				<>
					{/* Invisible fat hit area for pointer events; the visible wire is drawn by MindmapWireCanvas */}
					<path
						data-testid="MindmapWire"
						ref={hitPathRef}
						fill="none"
						stroke="none"
						pointerEvents="stroke"
						style={{ cursor: 'pointer', visibility: 'hidden', strokeWidth: 'var(--wire-hit-width)' }}
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
