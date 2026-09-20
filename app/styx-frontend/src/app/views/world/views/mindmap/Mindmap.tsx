import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import { useRef } from 'react'

import { MindmapQuickSelect } from './components/MindmapQuickSelect'
import { useMindmapNavigation } from './hooks/useMindmapNavigation'
import { MindmapContent } from './MindmapContent'
import { MindmapBulkContextMenu } from './workspace/MindmapBulkContextMenu'
import { MindmapClickArea } from './workspace/MindmapClickArea'
import { MindmapHotkeys } from './workspace/MindmapHotkeys'
import { MindmapNodeContextMenu } from './workspace/MindmapNodeContextMenu'

export function Mindmap() {
	const gridSpacing = 64
	const dotSize = 2

	const gridRef = useRef<HTMLDivElement>(null)
	const cameraRef = useRef<HTMLDivElement>(null)
	const backgroundRef = useRef<HTMLDivElement>(null)
	useMindmapNavigation({ gridRef, cameraRef, backgroundRef })

	const theme = useTheme()
	const dotColor = theme.palette.divider

	return (
		<Stack sx={{ width: '100%', height: '100%' }}>
			<Box
				ref={gridRef}
				data-testid="MindmapGrid"
				data-mindmap-grid
				sx={{
					position: 'absolute',
					width: '100%',
					height: '100%',
					overflow: 'clip',
					touchAction: 'none',
					transition: '--grid-scale var(--transition-duration) ease-out',
				}}
			>
				<MindmapClickArea />
				<Box
					ref={backgroundRef}
					sx={{
						position: 'absolute',
						width: '100%',
						height: '100%',
						pointerEvents: 'none',
						backgroundPosition: 'var(--grid-offset-x) var(--grid-offset-y)',
						backgroundImage: `radial-gradient(circle, ${dotColor} calc(${dotSize}px * var(--grid-scale)), transparent calc(${dotSize}px * var(--grid-scale)))`,
						backgroundSize: `calc(${gridSpacing}px * var(--grid-scale)) calc(${gridSpacing}px * var(--grid-scale))`,
						transition:
							'--grid-offset-x var(--transition-duration) ease-out, --grid-offset-y var(--transition-duration) ease-out',
						// transition:
						// 	'background-position var(--transition-duration) ease-out, background-size var(--transition-duration) ease-out',
					}}
				/>
				<Box
					sx={{
						position: 'absolute',
						width: '100%',
						height: '100%',
						pointerEvents: 'none',
						zIndex: 2,
					}}
				>
					<MindmapContent cameraRef={cameraRef} />
				</Box>
			</Box>
			<MindmapHotkeys />
			<MindmapQuickSelect />
			<MindmapNodeContextMenu />
			<MindmapBulkContextMenu />
		</Stack>
	)
}
