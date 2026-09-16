import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { ListSectionHeader } from '@/ui-lib/components/ListSection/ListSectionHeader'
import { LoadingState } from '@/ui-lib/components/LoadingState'

import { useRecentActivity } from '../hooks/useRecentActivity'
import { HomeActivityListItem } from './HomeActivityListItem'

export function HomeActivityList() {
	return (
		<Paper sx={{ borderRadius: 2, px: 2, py: 2 }}>
			<Stack gap={1.5}>
				<ListSectionHeader>Recent activity</ListSectionHeader>
				<Content />
			</Stack>
		</Paper>
	)
}

function Content() {
	const { activities, isLoading } = useRecentActivity()

	if (isLoading) {
		return <LoadingState />
	}

	if (activities.length === 0) {
		return (
			<Typography variant="body2" color="text.disabled" textAlign="center" py={2}>
				No recent activity yet.
			</Typography>
		)
	}

	return (
		<Stack sx={{ mx: -1 }}>
			{activities.map((activity) => (
				<HomeActivityListItem key={`${activity.type}-${activity.id}`} activity={activity} />
			))}
		</Stack>
	)
}
