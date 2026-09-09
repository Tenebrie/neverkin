import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import type { RecentActivity } from '../hooks/useHomeData'
import { HomeActivityCardItem } from './HomeActivityCardItem'
import { HomeSectionLabel } from './HomeSectionLabel'

type Props = {
	activities: RecentActivity[]
}

export function HomeActivityCard({ activities }: Props) {
	return (
		<Paper sx={{ borderRadius: 2, px: 2, py: 2 }}>
			<Stack gap={1.5}>
				<HomeSectionLabel>Recent activity</HomeSectionLabel>
				{activities.length > 0 ? (
					<Stack>
						{activities.map((activity) => (
							<HomeActivityCardItem key={`${activity.type}-${activity.id}`} activity={activity} />
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
