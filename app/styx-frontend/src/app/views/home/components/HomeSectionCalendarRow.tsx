import CalendarMonth from '@mui/icons-material/CalendarMonth'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { CalendarBrief } from '@/api/types/calendarTypes'
import { EntityInitialsTile } from '@/app/components/EntityInitialsTile'
import { NavigationLink } from '@/app/components/NavigationLink'
import { getAccentColor } from '@/app/utils/colors/getAccentColor'
import { DeleteCalendarButton } from '@/app/views/calendar/list/components/DeleteCalendarButton'

import { HomeSectionRow } from './HomeSectionRow'
import { HomeSectionRowActions } from './HomeSectionRowActions'

type Props = {
	calendar: CalendarBrief
}

export function HomeSectionCalendarRow({ calendar }: Props) {
	return (
		<NavigationLink to="/calendar/$calendarId" params={{ calendarId: calendar.id }}>
			<HomeSectionRow ariaLabel={`Load calendar "${calendar.name}"`}>
				<EntityInitialsTile
					name={calendar.name}
					color={getAccentColor(calendar.id)}
					icon={<CalendarMonth sx={{ fontSize: 18 }} />}
				/>
				<Stack flex={1} minWidth={0} gap={0.25}>
					<Typography variant="body1" fontWeight={600} noWrap>
						{calendar.name}
					</Typography>
					{calendar.description && (
						<Typography variant="body2" color="text.secondary" noWrap>
							{calendar.description}
						</Typography>
					)}
				</Stack>
				<HomeSectionRowActions updatedAt={calendar.updatedAt}>
					<DeleteCalendarButton
						calendarId={calendar.id}
						calendarName={calendar.name}
						slotProps={{
							primaryButton: {
								sx: { color: 'text.disabled', '&:hover': { color: 'text.primary' } },
							},
						}}
					/>
				</HomeSectionRowActions>
			</HomeSectionRow>
		</NavigationLink>
	)
}
