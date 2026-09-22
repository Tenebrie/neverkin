import Box from '@mui/material/Box'
import { darken, lighten } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { useRef } from 'react'

import { MindmapWire } from '@/api/types/mindmapTypes'
import { useEventBusSubscribe } from '@/app/features/eventBus'
import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'

type Props = {
	wire: MindmapWire
	onClick: (event: React.MouseEvent) => void
	onMouseDown: (event: React.MouseEvent) => void
	onMouseUp: (event: React.MouseEvent) => void
}

export function MindmapWireLabel({ wire, onClick, onMouseDown, onMouseUp }: Props) {
	const theme = useCustomTheme()
	const maxLabelLength = 24
	const labelText = wire.content
		? wire.content.length > maxLabelLength
			? wire.content.slice(0, maxLabelLength) + '…'
			: wire.content
		: ''

	const containerRef = useRef<HTMLElement>(null)
	useEventBusSubscribe['mindmap/selection/changed']({
		callback: ({ selectedWireIds }) => {
			const selected = selectedWireIds.has(wire.id)
			containerRef.current?.setAttribute('data-selected', String(selected))
		},
	})

	// TODO: Check why label is not rendering
	useEventBusSubscribe['mindmap/scale/changed']({
		callback: ({ scale }) => {
			const el = containerRef.current
			if (!el) {
				return
			}
			el.style.setProperty('--grid-scale', scale.toString())
		},
	})

	return (
		<Box
			ref={containerRef}
			onClick={onClick}
			onMouseDown={onMouseDown}
			onMouseUp={onMouseUp}
			sx={{
				background: theme.custom.palette.background.timeline,
				position: 'absolute',
				borderRadius: '16px',
				padding: '4px 8px',
				left: 0,
				top: 0,
				transform: `translate(
					calc(var(--label-position-x) * var(--grid-scale) - 50%), calc(var(--label-position-y) * var(--grid-scale) - 50%)
					) scale(var(--grid-scale))`,

				'--node-border-width': 'calc(1px / var(--grid-scale))',
				'--node-border-color': theme.material.palette.divider,
				pointerEvents: 'auto',
				userSelect: 'none',

				boxShadow: 'inset 0 0 0 var(--node-border-width) var(--node-border-color)',
				transition: '--node-border-color 0.25s ease-out',
				'&[data-selected="true"]': {
					'--node-border-color': theme.material.palette.primary.main,
					'&:hover': {
						'--node-border-color': lighten(theme.material.palette.primary.main, 0.0),
					},
					'&:active': {
						'--node-border-color': darken(theme.material.palette.primary.main, 0.3),
					},
				},
				'&:hover': {
					zIndex: 10,
					'--node-border-color': darken(theme.custom.palette.highlight, 0.0),
				},
				'&:active': {
					'--node-border-color': darken(theme.custom.palette.highlight, 0.3),
				},
			}}
		>
			<Typography className="mindmap-label-test">{labelText}</Typography>
		</Box>
	)
}
