import Box from '@mui/material/Box'
import { Fragment, memo, useCallback, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { dispatchGlobalEvent } from '@/app/features/eventBus'
import { useEffectOnce } from '@/app/hooks/useEffectOnce'
import { RootState } from '@/app/store'

import { BoxedMindmapWire } from '../hooks/useBoxedMindmapContent'
import { MindmapWireGhost } from './MindmapWireGhost'
import { MindmapWireLine } from './MindmapWireLine'
import { MindmapWirePopover, MindmapWireState } from './MindmapWirePopover'

type Props = {
	nodeLinks: BoxedMindmapWire[]
	existingWires: Set<string>
}

export const MindmapWireLayer = memo(MindmapWireLayerComponent)

function MindmapWireLayerComponent({ nodeLinks, existingWires }: Props) {
	const svgDefsRef = useRef<SVGDefsElement>(null)
	const svgGroupRef = useRef<SVGGElement>(null)
	const [refsReady, setRefsReady] = useState(false)

	useEffectOnce(() => {
		setRefsReady(true)
	})

	const [popoverState, setPopoverState] = useState<Omit<MindmapWireState, 'onClose'>>({
		open: false,
		position: { x: 0, y: 0 },
		mode: 'doubleClick',
	})

	const isBulkSelectContext = useSelector((state: RootState) => {
		const thingsSelected = state.mindmap.selectedNodes.length + state.mindmap.selectedWires.length
		return thingsSelected > 1
	})

	const onOpenPopover = useCallback(
		(position: { x: number; y: number }, mode: 'doubleClick' | 'contextMenu') => {
			if (isBulkSelectContext) {
				dispatchGlobalEvent['mindmap/bulk/requestOpenContextMenu']({
					position,
				})
			} else {
				setPopoverState({ open: true, position, mode })
			}
		},
		[isBulkSelectContext],
	)

	return (
		<Box
			sx={{
				position: 'absolute',
				inset: 0,
				pointerEvents: 'none',
				overflow: 'visible',
			}}
		>
			<svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
				<defs ref={svgDefsRef}></defs>
				<g
					ref={svgGroupRef}
					style={{
						willChange: 'transform',
						transform: 'translate(var(--grid-offset-x), var(--grid-offset-y)) scale(var(--grid-scale))',
						transformOrigin: '0 0',
						// transition: 'transform var(--transition-duration) ease-out',
					}}
				></g>
			</svg>
			{refsReady &&
				nodeLinks.map((link) => (
					<Fragment key={link.id}>
						<MindmapWireLine
							wire={link}
							source={link.sourceNode}
							target={link.targetNode}
							svgDefsPortal={svgDefsRef.current!}
							svgGroupPortal={svgGroupRef.current!}
							onOpenPopover={onOpenPopover}
						/>
					</Fragment>
				))}
			<MindmapWireGhost existingWires={existingWires} />
			<MindmapWirePopover
				{...popoverState}
				onClose={() => setPopoverState({ ...popoverState, open: false })}
			/>
		</Box>
	)
}
