import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import type { RecentActivity } from '../hooks/useHomeData'
import { HomeActivityListItem } from './HomeActivityListItem'
import { HomeSectionLabel } from './HomeSectionLabel'

type Props = {
	activities: RecentActivity[]
}

export function HomeActivityList({ activities }: Props) {
	return (
		<Paper sx={{ borderRadius: 2, px: 2, py: 2 }}>
			<Stack gap={1.5}>
				<HomeSectionLabel>Recent activity</HomeSectionLabel>
				{activities.length > 0 ? (
					<Stack sx={{ mx: -1 }}>
						{activities.map((activity) => (
							<HomeActivityListItem key={`${activity.type}-${activity.id}`} activity={activity} />
						))}
					</Stack>
				) : (
					<Typography variant="body2" color="text.disabled" textAlign="center" py={2}>
						No recent activity yet.
					</Typography>
				)}
			</Stack>
		</Paper>
	)
}
