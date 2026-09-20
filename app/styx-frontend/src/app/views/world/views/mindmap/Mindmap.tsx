import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import { useRef } from 'react'

import { MindmapEmptyState } from './components/MindmapEmptyState'
import { MindmapQuickSelect } from './components/MindmapQuickSelect'
import { useMindmapNavigation } from './hooks/useMindmapNavigation'
import { MindmapContent } from './MindmapContent'
import { CANVAS_ORIGIN, CANVAS_SIZE } from './utils/mindmapCanvas'
import { MindmapBulkContextMenu } from './workspace/MindmapBulkContextMenu'
import { MindmapClickArea } from './workspace/MindmapClickArea'
import { MindmapHotkeys } from './workspace/MindmapHotkeys'
import { MindmapNodeContextMenu } from './workspace/MindmapNodeContextMenu'

export function Mindmap() {
	const gridSpacing = 64
	const dotSize = 2

	const ref = useRef<HTMLDivElement>(null)
	useMindmapNavigation(ref)

	const theme = useTheme()
	const dotColor = theme.palette.divider

	return (
		<Stack sx={{ width: '100%', height: '100%' }}>
			<Box
				ref={ref}
				data-testid="MindmapGrid"
				data-mindmap-grid
				sx={{
					position: 'absolute',
					width: '100%',
					height: '100%',
					overflow: 'auto',
					overscrollBehavior: 'none',
					scrollbarWidth: 'none',
					touchAction: 'none',
				}}
			>
				<Box
					data-mindmap-canvas
					sx={{
						'--grid-origin': `calc(${CANVAS_ORIGIN}px * var(--grid-scale))`,
						position: 'relative',
						width: `calc(${CANVAS_SIZE}px * var(--grid-scale))`,
						height: `calc(${CANVAS_SIZE}px * var(--grid-scale))`,
						overflowAnchor: 'none',
						backgroundPosition: 'var(--grid-origin) var(--grid-origin)',
						backgroundImage: `radial-gradient(circle, ${dotColor} calc(${dotSize}px * var(--grid-scale)), transparent calc(${dotSize}px * var(--grid-scale)))`,
						backgroundSize: `calc(${gridSpacing}px * var(--grid-scale)) calc(${gridSpacing}px * var(--grid-scale))`,
					}}
				>
					<MindmapClickArea />
					<MindmapContent />
				</Box>
			</Box>
			<Box sx={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
				<MindmapEmptyState />
			</Box>
			<MindmapHotkeys />
			<MindmapQuickSelect />
			<MindmapNodeContextMenu />
			<MindmapBulkContextMenu />
		</Stack>
	)
}
