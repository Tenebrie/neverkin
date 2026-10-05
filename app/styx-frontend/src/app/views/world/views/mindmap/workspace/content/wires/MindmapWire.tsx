import Box from '@mui/material/Box'
import { useRef } from 'react'
import { createPortal } from 'react-dom'

import { useMindmapWire } from '@/app/views/world/views/mindmap/context/useMindmapContext'
import { MindmapWireParcel } from '@/app/views/world/views/mindmap/types'
import { useMindmapWireGeometry } from '@/app/views/world/views/mindmap/workspace/content/wires/hooks/useMindmapWireGeometry'
import { useMindmapWireHighlight } from '@/app/views/world/views/mindmap/workspace/content/wires/hooks/useMindmapWireHighlight'
import { useMindmapWireInteraction } from '@/app/views/world/views/mindmap/workspace/content/wires/hooks/useMindmapWireInteraction'

import { MindmapWireLabel } from './label/MindmapWireLabel'

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
	const containerRef = useRef<HTMLDivElement>(null)
	const hitPathRef = useRef<SVGPathElement>(null)

	const paint = useMindmapWireGeometry({ wire: boxedWire, containerRef, hitPathRef })
	useMindmapWireHighlight({ wire: boxedWire, paint, containerRef })
	const { pathProps, labelProps } = useMindmapWireInteraction({ wireId: wire.id, paint, onOpenPopover })

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
				</>,
				svgGroupPortal,
			)}
			{wire.content && <MindmapWireLabel wire={wire} {...labelProps} />}
		</Box>
	)
}
