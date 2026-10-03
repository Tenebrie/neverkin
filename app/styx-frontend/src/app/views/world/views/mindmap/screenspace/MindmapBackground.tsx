import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import { useRef } from 'react'

import { useMindmapPainter } from '../context/useMindmapPainter'

export function MindmapBackground() {
	const ref = useRef<HTMLDivElement>(null)

	const dotSize = 2
	const gridSpacing = 64

	const theme = useTheme()
	const dotColor = theme.palette.divider

	useMindmapPainter((navState) => {
		const background = ref.current
		if (!background) {
			return
		}

		background.style.display = navState.gridScale < 0.25 ? 'none' : ''
		const tile = gridSpacing * navState.gridScale
		const originX = -navState.targetScrollLeft
		const originY = -navState.targetScrollTop

		const tileOffsetX = ((originX % tile) + tile) % tile
		const tileOffsetY = ((originY % tile) + tile) % tile

		background.style.setProperty('--grid-phase-x', `${tileOffsetX}px`)
		background.style.setProperty('--grid-phase-y', `${tileOffsetY}px`)
		background.style.setProperty('--grid-scale', navState.gridScale.toString())
	})

	return (
		<Box
			ref={ref}
			sx={{
				position: 'absolute',
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
				backgroundImage: `radial-gradient(circle, ${dotColor} calc(${dotSize}px * var(--grid-scale)), transparent calc(${dotSize}px * var(--grid-scale)))`,
				backgroundSize: `calc(${gridSpacing}px * var(--grid-scale))  calc(${gridSpacing}px * var(--grid-scale))`,
				backgroundPosition: 'var(--grid-phase-x) var(--grid-phase-y)',
			}}
		/>
	)
}
