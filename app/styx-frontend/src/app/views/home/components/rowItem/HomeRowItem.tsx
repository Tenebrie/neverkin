import ButtonBase from '@mui/material/ButtonBase'
import { ReactNode } from 'react'

type Props = {
	ariaLabel: string
	children: ReactNode
}

export function HomeRowItem({ ariaLabel, children }: Props) {
	return (
		<ButtonBase
			component="div"
			aria-label={ariaLabel}
			sx={{
				position: 'relative',
				width: '100%',
				justifyContent: 'flex-start',
				textAlign: 'left',
				gap: 2,
				p: 2,
				minHeight: 78,
				'&:hover:not(:has(.MuiIconButton-root:hover))': { bgcolor: 'action.hover' },
			}}
		>
			{children}
		</ButtonBase>
	)
}
