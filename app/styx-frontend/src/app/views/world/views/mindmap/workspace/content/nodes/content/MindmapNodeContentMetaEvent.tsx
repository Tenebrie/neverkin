import Schedule from '@mui/icons-material/Schedule'
import { useSelector } from 'react-redux'

import { useFormatTimestamp } from '@/app/features/time/calendar/hooks/useFormatTimestamp'
import { getWorldState } from '@/app/views/world/WorldSliceSelectors'

type Props = {
	timestamp: number
}

export function MindmapNodeContentMetaEvent({ timestamp }: Props) {
	const { calendars } = useSelector(getWorldState, (a, b) => a.calendars === b.calendars)
	const formatTimestamp = useFormatTimestamp({ calendar: calendars[0] ?? null })

	return (
		<>
			<Schedule sx={{ fontSize: '1rem' }} />
			{formatTimestamp({ timestamp })}
		</>
	)
}
