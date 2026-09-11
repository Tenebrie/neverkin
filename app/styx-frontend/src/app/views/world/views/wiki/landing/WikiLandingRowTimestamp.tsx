import Typography from '@mui/material/Typography'

import { useTimeAgo } from '@/app/hooks/useTimeAgo'

type Props = {
	date: Date
}

export function WikiLandingRowTimestamp({ date }: Props) {
	const timeAgo = useTimeAgo(date)

	return (
		<Typography
			variant="caption"
			color="text.disabled"
			sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flex: '0 0 auto' }}
		>
			{timeAgo}
		</Typography>
	)
}
