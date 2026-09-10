import Typography from '@mui/material/Typography'
import { ReactNode } from 'react'

export function HomeSectionLabel({ children }: { children: ReactNode }) {
	return (
		<Typography component="h2" variant="overline" fontWeight="bold" color="text.secondary" lineHeight={1}>
			{children}
		</Typography>
	)
}
