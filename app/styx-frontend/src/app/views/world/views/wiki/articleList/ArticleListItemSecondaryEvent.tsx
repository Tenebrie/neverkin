import { SxProps } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

import { WorldEvent } from '@/api/types/worldTypes'
import { useWorldTime } from '@/app/features/time/hooks/useWorldTime'

type Props = {
	event: WorldEvent
	sx: SxProps
}

export function ArticleListItemSecondaryEvent({ event, sx }: Props) {
	const { timeToLabel } = useWorldTime()

	return (
		<Typography variant="caption" sx={sx}>
			{timeToLabel(event.timestamp)}
		</Typography>
	)
}
