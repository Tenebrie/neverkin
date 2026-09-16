import ButtonBase from '@mui/material/ButtonBase'
import Typography from '@mui/material/Typography'
import { ReactNode } from 'react'

type Props = {
	icon: ReactNode
	label: string
	meta?: ReactNode
	children?: ReactNode
	onClick: () => void
}

export function WikiLandingRow({ icon, label, meta, children, onClick }: Props) {
	return (
		<div>
			<ButtonBase
				component="div"
				aria-label={`Open "${label}"`}
				onClick={onClick}
				sx={{
					width: '100%',
					justifyContent: 'flex-start',
					textAlign: 'left',
					gap: 1.5,
					px: 1.75,
					py: 0.75,
					'&:hover:not(:has(.MuiIconButton-root:hover))': { bgcolor: 'action.hover' },
					'&:hover .dismiss-button': { opacity: 1 },
				}}
			>
				{icon}
				<Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: '44%' }}>
					{label}
				</Typography>
				<Typography
					component="span"
					variant="body2"
					color="text.secondary"
					noWrap
					sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}
				>
					{meta}
				</Typography>
				{children}
			</ButtonBase>
		</div>
	)
}
