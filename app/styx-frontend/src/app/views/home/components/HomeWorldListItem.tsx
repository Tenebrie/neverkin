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

import { HomeSectionWorldRowMenu } from './HomeWorldListItemMenu'
import { HomeWorldListItemPin } from './HomeWorldListItemPin'
import { HomeRowItem } from './rowItem/HomeRowItem'
import { HomeRowItemActions } from './rowItem/HomeRowItemActions'
import { HomeRowItemTraitChip } from './rowItem/HomeRowItemTraitChip'

type Props = {
	world: WorldBrief
	owned?: boolean
	readonly?: boolean
}

export function HomeWorldListItem({ world, owned, readonly }: Props) {
	const { lastOpenedWorldId } = useSelector(getHomePreferences)
	const isLastOpened = world.id === lastOpenedWorldId

	return (
		<NavigationLink to="/world/$worldId/wiki" params={{ worldId: world.id }}>
			<HomeRowItem ariaLabel={`Load world "${world.name}"`}>
				<EntityInitialsTile name={world.name} color={getAccentColor(world.id)} />
				<Stack flex={1} minWidth={0} gap={0.25}>
					<Stack direction="row" alignItems="center" gap={1} minWidth={0}>
						<Typography variant="body1" fontWeight={600} noWrap sx={{ minWidth: 0 }}>
							{world.name}
						</Typography>
						{isLastOpened && <HomeRowItemTraitChip label="Last opened" accent />}
						{readonly && <HomeRowItemTraitChip label="Read-only" />}
						{owned && world.accessMode !== 'Private' && <HomeRowItemTraitChip label="Public" />}
						{owned && world.collaborators.length > 0 && <HomeRowItemTraitChip label="Shared" />}
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
								<Box
									component="span"
									sx={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
								>
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
				<HomeRowItemActions updatedAt={world.updatedAt}>
					<HomeWorldListItemPin world={world} />
					<HomeSectionWorldRowMenu world={world} isOwned={owned ?? false} />
				</HomeRowItemActions>
			</HomeRowItem>
		</NavigationLink>
	)
}
