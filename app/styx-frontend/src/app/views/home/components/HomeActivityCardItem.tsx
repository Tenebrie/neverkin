import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { NavigationLink } from '@/app/components/NavigationLink'
import { getAccentColor } from '@/app/utils/colors/getAccentColor'

import type { RecentActivity } from '../hooks/useHomeData'
import { HomeSectionRow } from './HomeSectionRow'
import { HomeSectionRowTimestamp } from './HomeSectionRowTimestamp'

type Props = {
	activity: RecentActivity
}

export function HomeActivityCardItem({ activity }: Props) {
	const linkProps =
		activity.type === 'world'
			? ({ to: '/world/$worldId/wiki', params: { worldId: activity.id } } as const)
			: ({ to: '/calendar/$calendarId', params: { calendarId: activity.id } } as const)

	return (
		<NavigationLink {...linkProps}>
			<HomeSectionRow dense ariaLabel={`Open ${activity.type} "${activity.name}"`}>
				<Box
					sx={{
						width: 7,
						height: 7,
						flex: '0 0 auto',
						borderRadius: '50%',
						bgcolor: getAccentColor(activity.id),
					}}
				/>
				<Stack flex={1} minWidth={0}>
					<Typography variant="body2" noWrap>
						{activity.name}
					</Typography>
					<Typography variant="caption" color="text.secondary">
						{activity.type === 'world' ? 'World' : 'Calendar'} updated
					</Typography>
				</Stack>
				<HomeSectionRowTimestamp updatedAt={activity.updatedAt} />
			</HomeSectionRow>
		</NavigationLink>
	)
}
