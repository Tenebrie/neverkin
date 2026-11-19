import Box from '@mui/material/Box'
import { lighten } from '@mui/material/styles'
import { useRef } from 'react'
import { createPortal } from 'react-dom'

import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { useMindmapWire } from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { MindmapWireParcel } from '@/app/views/world/views/mindmap/types'
import { useMindmapWireGeometry } from '@/app/views/world/views/mindmap/workspace/content/wires/hooks/useMindmapWireGeometry'
import { useMindmapWireHighlight } from '@/app/views/world/views/mindmap/workspace/content/wires/hooks/useMindmapWireHighlight'
import { useMindmapWireInteraction } from '@/app/views/world/views/mindmap/workspace/content/wires/hooks/useMindmapWireInteraction'

import { MindmapWireLabel } from './label/MindmapWireLabel'
import { MindmapWireWaypoint } from './waypoint/MindmapWireWaypoint'

type Props = {
	wireId: string
	svgGroupPortal: SVGGElement
	onOpenPopover: (params: {
		wireId: string
		position: { x: number; y: number }
		mode: 'doubleClick' | 'contextMenu'
	}) => void
}

export function MindmapWireLine({ wireId, ...props }: Props) {
	const boxedWire = useMindmapWire(wireId)
	if (!boxedWire) {
		return null
	}

	return <MindmapWireLineComponent {...props} wire={boxedWire} />
}

type WireProps = Omit<Props, 'wireId'> & {
	wire: MindmapWireParcel
}

function MindmapWireLineComponent({ wire: boxedWire, svgGroupPortal, onOpenPopover }: WireProps) {
	const { wire } = boxedWire
	const theme = useCustomTheme()
	const baseColor = lighten(theme.custom.palette.background.timeline, 0.2)
	const colorAtSource = boxedWire.targetNode.parent.color ?? baseColor
	const colorAtTarget = boxedWire.sourceNode.parent.color ?? baseColor
	const containerRef = useRef<HTMLDivElement>(null)
	const hitPathRef = useRef<SVGPathElement>(null)

	const { paint, moveWaypoint } = useMindmapWireGeometry({
		wire: boxedWire,
		containerRef,
		hitPathRef,
	})
	useMindmapWireHighlight({
		wire: boxedWire,
		paint,
		containerRef,
	})
	const { pathProps, labelProps } = useMindmapWireInteraction({
		wireId: wire.id,
		paint,
		onOpenPopover,
	})

	return (
		<Box ref={containerRef}>
			{createPortal(
				<>
					{/* Invisible hit area for pointer events*/}
					<path
						data-testid="MindmapWire"
						ref={hitPathRef}
						fill="none"
						stroke="none"
						pointerEvents="stroke"
						style={{ cursor: 'pointer', visibility: 'hidden', strokeWidth: 'var(--wire-hit-width)' }}
						{...pathProps}
					/>
					{wire.waypoints.map((waypoint, index) => {
						const progress = ((index + 1) / (wire.waypoints.length + 1)) * 100
						return (
							<MindmapWireWaypoint
								key={waypoint.id}
								wireId={wire.id}
								waypoint={waypoint}
								index={index}
								color={`color-mix(in oklch shorter hue, ${colorAtSource} ${100 - progress}%, ${colorAtTarget})`}
								onMove={moveWaypoint}
							/>
						)
					})}
				</>,
				svgGroupPortal,
			)}
			{wire.content && <MindmapWireLabel wire={wire} {...labelProps} />}
		</Box>
	)
}
