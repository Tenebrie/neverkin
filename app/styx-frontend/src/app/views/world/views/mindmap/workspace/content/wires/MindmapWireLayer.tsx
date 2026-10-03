import { useCallback, useLayoutEffect, useState } from 'react'
import { useStore } from 'react-redux'

import { dispatchGlobalEvent, useEventBusSubscribe } from '@/app/features/eventBus'
import { RootState } from '@/app/store'
import { useMindmapWireIds } from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { useMindmapPainter } from '@/app/views/world/views/mindmap/context/useMindmapPainter'
import { MindmapState } from '@/app/views/world/views/mindmap/MindmapState'
import { MindmapWireLine } from '@/app/views/world/views/mindmap/unrefactored/MindmapWireLine'

import { GLOW_WIDTH } from './canvas/MindmapCanvas'
import { MindmapWireGhostContext } from './ghost/context/MindmapWireGhostContext'
import { MindmapWireGhost } from './ghost/MindmapWireGhost'
import { MindmapWirePopover, MindmapWireState } from './MindmapWirePopover'

export function MindmapWireLayer() {
	const wireIds = useMindmapWireIds()
	const [svgGroup, setSvgGroup] = useState<SVGGElement | null>(null)
	const store = useStore<RootState>()

	useLayoutEffect(() => {
		svgGroup?.style.setProperty('--grid-scale', String(MindmapState.scale))
		svgGroup?.style.setProperty('--wire-hit-width', getWireHitWidth(MindmapState.scale))
	}, [svgGroup])

	useEventBusSubscribe['mindmap/scale/commit']({
		callback: ({ scale }) => {
			svgGroup?.style.setProperty('--wire-hit-width', getWireHitWidth(scale))
		},
	})

	const [popoverState, setPopoverState] = useState<Omit<MindmapWireState, 'onClose'>>({
		open: false,
		position: { x: 0, y: 0 },
		mode: 'doubleClick',
	})

	const onOpenPopover = useCallback(
		(position: { x: number; y: number }, mode: 'doubleClick' | 'contextMenu') => {
			const state = store.getState().mindmap
			const isBulkSelectContext = state.selectedNodes.length + state.selectedWires.length > 1
			if (isBulkSelectContext) {
				dispatchGlobalEvent['mindmap/bulk/requestOpenContextMenu']({
					position,
				})
			} else {
				setPopoverState({ open: true, position, mode })
			}
		},
		[store],
	)

	useMindmapPainter((navState) => {
		svgGroup?.style.setProperty('--grid-scale', navState.gridScale.toString())
	})

	return (
		<>
			<svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
				<g
					ref={setSvgGroup}
					style={{
						transform: 'scale(var(--grid-scale))',
						transformOrigin: '0 0',
					}}
				></g>
			</svg>
			{svgGroup && (
				<>
					{wireIds.map((wireId) => (
						<MindmapWireLine
							key={wireId}
							wireId={wireId}
							svgGroupPortal={svgGroup}
							onOpenPopover={onOpenPopover}
						/>
					))}
					<MindmapWireGhostContext>
						<MindmapWireGhost svgGroupPortal={svgGroup} />
					</MindmapWireGhostContext>
				</>
			)}
			<MindmapWirePopover
				{...popoverState}
				onClose={() =>
					setPopoverState((current) => ({
						...current,
						open: false,
					}))
				}
			/>
		</>
	)
}

function getWireHitWidth(scale: number) {
	return `${Math.max(16 / scale, GLOW_WIDTH)}px`
}
