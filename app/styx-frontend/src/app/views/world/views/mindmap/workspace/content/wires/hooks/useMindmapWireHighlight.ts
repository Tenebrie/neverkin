import { alpha, lighten } from '@mui/material/styles'
import { RefObject, useLayoutEffect, useRef } from 'react'

import { useEventBusSubscribe } from '@/app/features/eventBus'
import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { useMindmapContext } from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { MindmapWireParcel } from '@/app/views/world/views/mindmap/types'
import { WirePaint } from '@/app/views/world/views/mindmap/workspace/content/wires/canvas/MindmapWireBuffer'

type WireHighlightState = 'none' | 'brightGradient' | 'brightSource' | 'brightTarget' | 'dim'

type Props = {
	wire: MindmapWireParcel
	paint: WirePaint
	containerRef: RefObject<HTMLDivElement | null>
}

export function useMindmapWireHighlight({
	wire: { wire, sourceNode, targetNode },
	paint,
	containerRef,
}: Props) {
	const { wireBuffer } = useMindmapContext()
	const theme = useCustomTheme()
	const highlightStateRef = useRef<WireHighlightState>('none')

	const applyHighlightState = () => {
		const highlightState = highlightStateRef.current
		const baseColor = lighten(theme.custom.palette.background.timeline, 0.2)
		const { sourceColor, targetColor } = getLineColors(
			highlightState,
			baseColor,
			sourceNode.parent.color ?? baseColor,
			targetNode.parent.color ?? baseColor,
		)
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
			} else if (hoveredNodeIds.has(sourceNode.node.id)) {
				setHighlightState('brightSource')
			} else if (hoveredNodeIds.has(targetNode.node.id)) {
				setHighlightState('brightTarget')
			} else if (hoveredNodeIds.size > 0) {
				setHighlightState('dim')
			} else {
				setHighlightState('none')
			}
		},
	})

	useLayoutEffect(() => {
		applyHighlightState()
	})
}

function getLineColors(
	highlightState: WireHighlightState,
	baseColor: string,
	sourceParentColor: string,
	targetParentColor: string,
) {
	const alwaysShowColor = true

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
