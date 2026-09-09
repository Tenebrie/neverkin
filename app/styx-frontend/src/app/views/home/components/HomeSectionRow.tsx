import ButtonBase from '@mui/material/ButtonBase'
import { ReactNode } from 'react'

type Props = {
	ariaLabel: string
	highlighted?: boolean
	children: ReactNode
}

export function HomeSectionRow({ ariaLabel, highlighted, children }: Props) {
	return (
		<ButtonBase
			component="div"
			aria-label={ariaLabel}
			sx={{
				position: 'relative',
				width: '100%',
				gap: 2,
				p: 2,
				justifyContent: 'flex-start',
				textAlign: 'left',
				'&:hover:not(:has(.MuiIconButton-root:hover))': { bgcolor: 'action.hover' },
				...(highlighted && {
					'&::before': {
						content: '""',
						position: 'absolute',
						left: 0,
						top: 0,
						bottom: 0,
						width: 2,
						bgcolor: 'primary.main',
					},
				}),
			}}
		>
			{children}
		</ButtonBase>
	)
}
