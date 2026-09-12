import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { useTimeAgo } from '@/app/hooks/useTimeAgo'

type Props = {
	date: string
	formatDate: (date: string) => string
}

export function AdminUserTimestamp({ date, formatDate }: Props) {
	const timeAgo = useTimeAgo(new Date(date))

	return (
		<Tooltip title={formatDate(date)}>
			<Typography
				component="span"
				variant="inherit"
				color="text.secondary"
				sx={{ textDecoration: 'underline dotted', textUnderlineOffset: 3, cursor: 'help' }}
			>
				{timeAgo}
			</Typography>
		</Tooltip>
	)
}
