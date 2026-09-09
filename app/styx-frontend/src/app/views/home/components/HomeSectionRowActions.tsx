import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ReactNode } from 'react'

type Props = {
	timestamp: string
	children: ReactNode
}

export function HomeSectionRowActions({ timestamp, children }: Props) {
	return (
		<Stack direction="row" alignItems="center" gap={0.25} sx={{ flex: '0 0 auto' }}>
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{ fontVariantNumeric: 'tabular-nums', mr: 0.75, whiteSpace: 'nowrap' }}
			>
				{timestamp}
			</Typography>
			<Stack
				direction="row"
				gap={0.25}
				onClick={(e) => e.stopPropagation()}
				onMouseDown={(e) => e.stopPropagation()}
			>
				{children}
			</Stack>
		</Stack>
	)
}
