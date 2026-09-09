import CalendarMonth from '@mui/icons-material/CalendarMonth'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSelector } from 'react-redux'

import { WorldBrief } from '@/api/types/worldTypes'
import { EntityInitialsTile } from '@/app/components/EntityInitialsTile'
import { NavigationLink } from '@/app/components/NavigationLink'
import { getHomePreferences } from '@/app/features/preferences/PreferencesSliceSelectors'
import { getAccentColor } from '@/app/utils/colors/getAccentColor'
import { formatTimeAgo } from '@/app/views/home/utils/formatTimeAgo'

import { HomeSectionRow } from './HomeSectionRow'
import { HomeSectionRowActions } from './HomeSectionRowActions'
import { HomeSectionRowTag } from './HomeSectionRowTag'
import { HomeSectionWorldRowMenu } from './HomeSectionWorldRowMenu'
import { HomeSectionWorldRowPin } from './HomeSectionWorldRowPin'

type Props = {
	world: WorldBrief
	/** Access level shown for worlds owned by someone else. Absent means the world is the user's own. */
	role?: string
}

export function HomeSectionWorldRow({ world, role }: Props) {
	const { lastOpenedWorldId } = useSelector(getHomePreferences)
	const isOwned = !role
	const isLastOpened = world.id === lastOpenedWorldId

	return (
		<NavigationLink
			to="/world/$worldId/wiki"
			params={{ worldId: world.id }}
			search={(prev) => ({
				...prev,
				time: parseInt(world.timeOrigin),
			})}
		>
			<HomeSectionRow ariaLabel={`Load world "${world.name}"`} highlighted={isLastOpened}>
				<EntityInitialsTile name={world.name} color={getAccentColor(world.id)} />
				<Stack flex={1} minWidth={0} gap={0.25}>
					<Stack direction="row" alignItems="center" gap={1} minWidth={0}>
						<Typography variant="body1" fontWeight={600} noWrap sx={{ minWidth: 0 }}>
							{world.name}
						</Typography>
						{isLastOpened && <HomeSectionRowTag label="Last opened" accent />}
						{role && <HomeSectionRowTag label={role} />}
						{isOwned && world.accessMode !== 'Private' && <HomeSectionRowTag label="Public" />}
						{isOwned && world.collaborators.length > 0 && <HomeSectionRowTag label="Shared" />}
					</Stack>
					<Stack
						direction="row"
						alignItems="center"
						gap={1}
						minWidth={0}
						sx={{ typography: 'body2', color: 'text.secondary' }}
					>
						{world.description && (
							<>
								<Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '46%' }}>
									{world.description}
								</Box>
								<Box component="span" sx={{ color: 'text.disabled' }}>
									·
								</Box>
							</>
						)}
						<Stack direction="row" alignItems="center" gap={0.5} sx={{ flex: '0 0 auto' }}>
							<CalendarMonth sx={{ fontSize: 14, color: 'text.disabled' }} />
							{world.calendars[0]?.name ?? 'No calendar'}
						</Stack>
					</Stack>
				</Stack>
				<HomeSectionRowActions timestamp={formatTimeAgo(new Date(world.updatedAt))}>
					<HomeSectionWorldRowPin world={world} />
					<HomeSectionWorldRowMenu world={world} isOwned={isOwned} />
				</HomeSectionRowActions>
			</HomeSectionRow>
		</NavigationLink>
	)
}
