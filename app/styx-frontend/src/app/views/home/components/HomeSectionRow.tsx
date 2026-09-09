import ButtonBase from '@mui/material/ButtonBase'
import { ReactNode } from 'react'

type Props = {
	ariaLabel: string
	dense?: boolean
	children: ReactNode
}

export function HomeSectionRow({ ariaLabel, dense, children }: Props) {
	return (
		<ButtonBase
			component="div"
			aria-label={ariaLabel}
			sx={{
				position: 'relative',
				width: '100%',
				justifyContent: 'flex-start',
				textAlign: 'left',
				...(dense ? { gap: 1.25, px: 0.5, py: 1, borderRadius: 1 } : { gap: 2, p: 2 }),
				'&:hover:not(:has(.MuiIconButton-root:hover))': { bgcolor: 'action.hover' },
			}}
		>
			{children}
		</ButtonBase>
	)
}
