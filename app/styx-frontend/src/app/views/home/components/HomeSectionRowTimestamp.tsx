import Typography from '@mui/material/Typography'

import { useTimeAgo } from '@/app/hooks/useTimeAgo'

type Props = {
	updatedAt: string
}

export function HomeSectionRowTimestamp({ updatedAt }: Props) {
	const formattedTimeAgo = useTimeAgo(new Date(updatedAt))

	return (
		<Typography
			variant="caption"
			color="text.secondary"
			sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flex: '0 0 auto' }}
		>
			{formattedTimeAgo}
		</Typography>
	)
}
