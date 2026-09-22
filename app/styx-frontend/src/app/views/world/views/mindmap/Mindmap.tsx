import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import { useRef } from 'react'

import { MindmapEmptyState } from './components/MindmapEmptyState'
import { MindmapQuickSelect } from './components/MindmapQuickSelect'
import { useMindmapNavigation } from './hooks/useMindmapNavigation'
import { MindmapContent } from './MindmapContent'
import { CANVAS_ORIGIN, CANVAS_SIZE, GRID_SPACING } from './utils/mindmapCanvas'
import { MindmapBulkContextMenu } from './workspace/MindmapBulkContextMenu'
import { MindmapClickArea } from './workspace/MindmapClickArea'
import { MindmapHotkeys } from './workspace/MindmapHotkeys'
import { MindmapMutationBridge } from './workspace/MindmapMutationBridge'
import { MindmapNodeContextMenu } from './workspace/MindmapNodeContextMenu'

export function Mindmap() {
	const dotSize = 2

	const ref = useRef<HTMLDivElement>(null)
	const backgroundRef = useRef<HTMLDivElement>(null)
	useMindmapNavigation(ref, backgroundRef)

	const theme = useTheme()
	const dotColor = theme.palette.divider

	return (
		<Stack sx={{ width: '100%', height: '100%' }}>
			<Box
				ref={backgroundRef}
				sx={{
					position: 'absolute',
					width: '100%',
					height: '100%',
					pointerEvents: 'none',
					backgroundImage: `radial-gradient(circle, ${dotColor} calc(${dotSize}px * var(--grid-scale)), transparent calc(${dotSize}px * var(--grid-scale)))`,
					backgroundSize: `calc(${GRID_SPACING}px * var(--grid-scale)) calc(${GRID_SPACING}px * var(--grid-scale))`,
					backgroundPosition: 'var(--grid-phase-x) var(--grid-phase-y)',
				}}
			/>
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
					sx={{
						'--grid-origin': `calc(${CANVAS_ORIGIN}px * var(--grid-scale))`,
						position: 'relative',
						width: `calc(${CANVAS_SIZE}px * var(--grid-scale))`,
						height: `calc(${CANVAS_SIZE}px * var(--grid-scale))`,
						overflowAnchor: 'none',
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
			<MindmapMutationBridge />
			<MindmapQuickSelect />
			<MindmapNodeContextMenu />
			<MindmapBulkContextMenu />
		</Stack>
	)
}
