import Box from '@mui/material/Box'
import { memo, useCallback, useRef, useState } from 'react'
import { useStore } from 'react-redux'

import { dispatchGlobalEvent, useEventBusSubscribe } from '@/app/features/eventBus'
import { useEffectOnce } from '@/app/hooks/useEffectOnce'
import { RootState } from '@/app/store'

import { useMindmapWireIds } from '../hooks/useMindmapContentStore'
import { MindmapWireGhost } from './MindmapWireGhost'
import { MindmapWireLine } from './MindmapWireLine'
import { MindmapWirePopover, MindmapWireState } from './MindmapWirePopover'

export const MindmapWireLayer = memo(MindmapWireLayerComponent)

function MindmapWireLayerComponent() {
	const wireIds = useMindmapWireIds()
	const svgDefsRef = useRef<SVGDefsElement>(null)
	const svgGroupRef = useRef<SVGGElement>(null)
	const [refsReady, setRefsReady] = useState(false)
	const store = useStore<RootState>()

	useEffectOnce(() => {
		setRefsReady(true)
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

	useEventBusSubscribe['mindmap/scale/changed']({
		callback: ({ scale }) => {
			const el = svgGroupRef.current
			if (!el) {
				return
			}
			el.style.setProperty('--grid-scale', scale.toString())
		},
	})

	return (
		<Box
			sx={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100vw',
				height: '100vh',
				pointerEvents: 'none',
				overflow: 'visible',
			}}
		>
			<svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
				<defs ref={svgDefsRef}></defs>
				<g
					ref={svgGroupRef}
					style={{
						transform: 'scale(var(--grid-scale))',
						transformOrigin: '0 0',
						// transition: 'transform var(--transition-duration) ease-out',
					}}
				></g>
			</svg>
			{refsReady &&
				wireIds.map((wireId) => (
					<MindmapWireLine
						key={wireId}
						wireId={wireId}
						svgDefsPortal={svgDefsRef.current!}
						svgGroupPortal={svgGroupRef.current!}
						onOpenPopover={onOpenPopover}
					/>
				))}
			<MindmapWireGhost />
			<MindmapWirePopover
				{...popoverState}
				onClose={() => setPopoverState({ ...popoverState, open: false })}
			/>
		</Box>
	)
}
