import Typography from '@mui/material/Typography'

import { formatTimeAgo } from '@/app/utils/formatTimeAgo'

type Props = {
	updatedAt: string
}

export function HomeSectionRowTimestamp({ updatedAt }: Props) {
	return (
		<Typography
			variant="caption"
			color="text.secondary"
			sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flex: '0 0 auto' }}
		>
			{formatTimeAgo(new Date(updatedAt))}
		</Typography>
	)
}
