import ButtonBase from '@mui/material/ButtonBase'
import { ReactNode } from 'react'

type Props = {
	ariaLabel: string
	highlighted?: boolean
	dense?: boolean
	children: ReactNode
}

export function HomeSectionRow({ ariaLabel, highlighted, dense, children }: Props) {
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
