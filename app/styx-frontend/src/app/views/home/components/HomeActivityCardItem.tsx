import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { NavigationLink } from '@/app/components/NavigationLink'
import { getAccentColor } from '@/app/utils/colors/getAccentColor'
import { formatTimeAgo } from '@/app/views/home/utils/formatTimeAgo'

import type { RecentActivity } from '../hooks/useHomeData'

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
			<ButtonBase
				component="div"
				sx={{
					width: '100%',
					gap: 1.25,
					px: 0.5,
					py: 1,
					borderRadius: 1,
					justifyContent: 'flex-start',
					textAlign: 'left',
					'&:hover': { bgcolor: 'action.hover' },
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
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{ fontVariantNumeric: 'tabular-nums', flex: '0 0 auto' }}
				>
					{formatTimeAgo(activity.updatedAt)}
				</Typography>
			</ButtonBase>
		</NavigationLink>
	)
}
