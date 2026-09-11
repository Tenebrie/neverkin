import CalendarMonth from '@mui/icons-material/CalendarMonth'
import { useMemo } from 'react'

import { recentFirst } from '@/app/utils/sorting/recentFirst'

import { LoadingState } from '../../../../ui-lib/components/LoadingState'
import { CalendarListCreateNewButton } from '../../calendar/list/CalendarListCreateNewButton'
import { useCalendarListData } from '../hooks/useCalendarListData'
import { HomeCalendarListItem } from './HomeCalendarListItem'
import { HomeSection } from './section/HomeSection'
import { HomeSectionEmptyState } from './section/HomeSectionEmptyState'

export function HomeCalendarList() {
	const { calendars, isLoading } = useCalendarListData()

	const sortedCalendars = useMemo(() => {
		return [...calendars].sort(recentFirst)
	}, [calendars])

	if (isLoading) {
		return (
			<HomeSection label="Calendars" count={0}>
				<LoadingState />
			</HomeSection>
		)
	}

	if (!calendars || calendars.length === 0) {
		return (
			<HomeSectionEmptyState
				icon={<CalendarMonth />}
				title="Calendars"
				cta="Define your own time"
				description="A calendar sets the units, seasons and dates every timeline in your worlds is measured in."
				action={<CalendarListCreateNewButton variant="contained" />}
			/>
		)
	}

	return (
		<HomeSection
			label="Calendars"
			count={calendars.length}
			action={<CalendarListCreateNewButton variant="outlined" />}
		>
			{sortedCalendars.map((calendar) => (
				<HomeCalendarListItem key={calendar.id} calendar={calendar} />
			))}
		</HomeSection>
	)
}
