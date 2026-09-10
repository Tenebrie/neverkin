import CalendarMonth from '@mui/icons-material/CalendarMonth'
import Public from '@mui/icons-material/Public'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'

import { CalendarListCreateNewButton } from '@/app/views/calendar/list/CalendarListCreateNewButton'
import { WorldListCreateNewButton } from '@/app/views/worldManagement/components/WorldList/WorldListCreateNewButton'
import { DeleteWorldModal } from '@/app/views/worldManagement/modals/DeleteWorldModal'

import { HomeActivityList } from './components/HomeActivityList'
import { HomeHeader } from './components/HomeHeader'
import { HomeSection } from './components/HomeSection'
import { HomeSectionCalendarRow } from './components/HomeSectionCalendarRow'
import { HomeSectionEmptyState } from './components/HomeSectionEmptyState'
import { HomeSectionWorldRow } from './components/HomeSectionWorldRow'
import { useHomeData } from './hooks/useHomeData'

export function HomeView() {
	const { isLoading, ownedWorlds, sharedWorlds, calendars, recentActivity, totals } = useHomeData()

	if (isLoading) {
		return (
			<Stack width="100%" height="100%" alignItems="center" justifyContent="center">
				<CircularProgress />
			</Stack>
		)
	}

	return (
		<Stack width="100%" height="100%" alignItems="center" sx={{ overflowY: 'auto' }}>
			<Container maxWidth="lg" sx={{ pt: 4 }}>
				<HomeHeader totals={totals} />
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) 316px' },
						gap: 3,
						alignItems: 'start',
					}}
				>
					<Stack gap={3} minWidth={0} pb="50vh">
						<HomeSection label="Your worlds" count={totals.owned}>
							{totals.owned === 0 ? (
								<HomeSectionEmptyState
									icon={<Public />}
									title="Start a world of your own"
									description="A world holds your wiki, timeline and mindmap. You can invite others later."
									action={<WorldListCreateNewButton variant="labelled" label="Get started" />}
								/>
							) : (
								ownedWorlds.map((world) => <HomeSectionWorldRow key={world.id} world={world} />)
							)}
						</HomeSection>
						{totals.shared > 0 && (
							<HomeSection label="Shared with you" count={totals.shared}>
								{sharedWorlds.map((world) => (
									<HomeSectionWorldRow key={world.id} world={world} role={world.role} />
								))}
							</HomeSection>
						)}
						<HomeSection
							label="Calendars"
							count={totals.calendars}
							action={<CalendarListCreateNewButton variant="labelled" />}
						>
							{totals.calendars === 0 ? (
								<HomeSectionEmptyState
									icon={<CalendarMonth />}
									title="Define your own time"
									description="A calendar sets the units, seasons and dates every timeline in your worlds is measured in."
								/>
							) : (
								calendars.map((calendar) => <HomeSectionCalendarRow key={calendar.id} calendar={calendar} />)
							)}
						</HomeSection>
					</Stack>
					<Box sx={{ position: 'sticky', top: 22 }}>
						<HomeActivityList activities={recentActivity} />
					</Box>
				</Box>
			</Container>
			<DeleteWorldModal />
		</Stack>
	)
}
