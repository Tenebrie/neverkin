import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { NavigationLink } from '@/app/components/NavigationLink'
import { getAccentColor } from '@/app/utils/colors/getAccentColor'

import type { RecentActivity } from '../hooks/useHomeData'
import { HomeSectionRowTimestamp } from './HomeSectionRowTimestamp'

type Props = {
	activity: RecentActivity
}

export function HomeActivityListItem({ activity }: Props) {
	const linkProps =
		activity.type === 'world'
			? ({ to: '/world/$worldId/wiki', params: { worldId: activity.id } } as const)
			: ({ to: '/calendar/$calendarId', params: { calendarId: activity.id } } as const)

	return (
		<NavigationLink {...linkProps}>
			<ButtonBase
				component="div"
				aria-label={`Open ${activity.type} "${activity.name}"`}
				sx={{
					position: 'relative',
					width: '100%',
					justifyContent: 'flex-start',
					textAlign: 'left',
					gap: 1.25,
					px: 1.5,
					py: 1,
					borderRadius: 1,
					'&:hover:not(:has(.MuiIconButton-root:hover))': { bgcolor: 'action.hover' },
				}}
			>
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
			</ButtonBase>
		</NavigationLink>
	)
}
