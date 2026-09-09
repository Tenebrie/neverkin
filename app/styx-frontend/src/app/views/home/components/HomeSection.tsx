import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { ReactNode } from 'react'

import { HomeSectionLabel } from './HomeSectionLabel'

type Props = {
	label: string
	count: number
	action?: ReactNode
	children: ReactNode
}

export function HomeSection({ label, count, action, children }: Props) {
	return (
		<Stack gap={1.5}>
			<Stack direction="row" alignItems="center" gap={1} sx={{ px: 0.25, minHeight: 34 }}>
				<HomeSectionLabel>{label}</HomeSectionLabel>
				<Box
					sx={{
						typography: 'caption',
						fontWeight: 600,
						fontVariantNumeric: 'tabular-nums',
						color: 'text.disabled',
						bgcolor: 'action.hover',
						borderRadius: '999px',
						px: 1,
					}}
				>
					{count}
				</Box>
				<Box sx={{ flex: 1 }} />
				{action}
			</Stack>
			<Paper
				variant="outlined"
				sx={{
					borderRadius: 2,
					overflow: 'hidden',
					'& > :not(:first-of-type) > *': { borderTop: '1px solid', borderColor: 'divider' },
				}}
			>
				{children}
			</Paper>
		</Stack>
	)
}
