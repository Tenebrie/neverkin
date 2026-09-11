import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSelector } from 'react-redux'

import { getAuthState } from '@/app/features/auth/AuthSliceSelectors'
import { pluralize } from '@/app/utils/pluralize'
import { WorldListCreateNewButton } from '@/app/views/worldManagement/components/WorldList/WorldListCreateNewButton'

import { useWorldListData } from '../../worldManagement/hooks/useWorldListData'
import { useCalendarListData } from '../hooks/useCalendarListData'

export function HomeHeader() {
	const { user } = useSelector(getAuthState)
	const worldData = useWorldListData()
	const calendarData = useCalendarListData()

	const owned = worldData.ownedWorlds.length
	const shared = worldData.contributableWorlds.length + worldData.visibleWorlds.length
	const calendarCount = calendarData.calendars.length

	const stats = [
		owned > 0 ? `${pluralize(owned, 'world')} of your own` : 'No worlds yet',
		shared > 0 ? `${shared} shared with you` : '',
		calendarCount > 0 ? pluralize(calendarCount, 'calendar') : '',
	]
		.filter(Boolean)
		.join(' · ')

	const isReady = worldData.isReady && calendarData.isReady

	return (
		<Stack direction="row" alignItems="center" gap={3} flexWrap="wrap" sx={{ mb: 4 }}>
			<Box>
				<Typography variant="h5" fontWeight={600}>
					Welcome back{user ? ',' : ''} {user?.username.split(' ')[0]}
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
					{isReady ? stats : <>&nbsp;</>}
				</Typography>
			</Box>
			<Box sx={{ ml: 'auto' }}>{owned > 0 && <WorldListCreateNewButton variant="labelled" />}</Box>
		</Stack>
	)
}
