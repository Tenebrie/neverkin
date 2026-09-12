import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { ReactNode } from 'react'

type Props = {
	label: string
	width?: number
	children: ReactNode
}

export function AdminUserHeaderField({ label, width, children }: Props) {
	return (
		<Paper
			variant="outlined"
			sx={{
				padding: '12px 20px',
				flex: width ? `0 0 ${width}px` : '1 1 0',
				minWidth: 160,
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				gap: 0.5,
			}}
		>
			<Typography variant="body2" color="text.secondary">
				{label}
			</Typography>
			{children}
		</Paper>
	)
}
