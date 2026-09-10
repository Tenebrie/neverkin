import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSelector } from 'react-redux'

import { getAuthState } from '@/app/features/auth/AuthSliceSelectors'
import { pluralize } from '@/app/utils/pluralize'
import { WorldListCreateNewButton } from '@/app/views/worldManagement/components/WorldList/WorldListCreateNewButton'

type Props = {
	totals: { owned: number; shared: number; calendars: number }
}

export function HomeHeader({ totals }: Props) {
	const { user } = useSelector(getAuthState)

	const stats = [
		totals.owned > 0 ? `${pluralize(totals.owned, 'world')} of your own` : 'No worlds yet',
		totals.shared > 0 ? `${totals.shared} shared with you` : '',
		totals.calendars > 0 ? pluralize(totals.calendars, 'calendar') : '',
	]
		.filter(Boolean)
		.join(' · ')

	return (
		<Stack direction="row" alignItems="center" gap={3} flexWrap="wrap" sx={{ mb: 4 }}>
			<Box>
				<Typography variant="h5" fontWeight={600}>
					Welcome back, {user?.username.split(' ')[0]}
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
					{stats}
				</Typography>
			</Box>
			<Box sx={{ ml: 'auto' }}>{totals.owned > 0 && <WorldListCreateNewButton variant="labelled" />}</Box>
		</Stack>
	)
}
