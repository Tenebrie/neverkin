import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { ReactNode } from 'react'

type Props = {
	icon: ReactNode
	title: string
	children: ReactNode
}

export function AdminDashboardSection({ icon, title, children }: Props) {
	const theme = useTheme()
	return (
		<Paper
			variant="outlined"
			sx={{
				padding: 2.5,
				borderRadius: 2,
				background: theme.palette.background.default,
			}}
		>
			<Stack direction="row" alignItems="center" gap={1} marginBottom={2}>
				{icon}
				<Typography variant="subtitle1" fontWeight={600}>
					{title}
				</Typography>
			</Stack>
			<Stack direction="row" gap={2} flexWrap="wrap">
				{children}
			</Stack>
		</Paper>
	)
}
