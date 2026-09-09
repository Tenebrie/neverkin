import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { alpha } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { ReactNode } from 'react'

type Props = {
	icon: ReactNode
	title: string
	description: string
	action?: ReactNode
}

export function HomeSectionEmptyState({ icon, title, description, action }: Props) {
	return (
		<Stack direction="row" alignItems="center" gap={2} sx={{ px: 2, py: 2.5 }}>
			<Box
				sx={{
					width: 44,
					height: 44,
					flex: '0 0 auto',
					borderRadius: 1.5,
					display: 'grid',
					placeItems: 'center',
					bgcolor: (theme) => alpha(theme.palette.primary.main, 0.18),
					color: 'primary.main',
				}}
			>
				{icon}
			</Box>
			<Stack flex={1} minWidth={0}>
				<Typography variant="body1" fontWeight={600}>
					{title}
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ textWrap: 'pretty' }}>
					{description}
				</Typography>
			</Stack>
			{action}
		</Stack>
	)
}
