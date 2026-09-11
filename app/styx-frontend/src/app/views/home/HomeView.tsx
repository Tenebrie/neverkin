import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'

import { DeleteWorldModal } from '@/app/views/worldManagement/modals/DeleteWorldModal'
import { LeaveWorldModal } from '@/app/views/worldManagement/modals/LeaveWorldModal'

import { HomeActivityList } from './components/HomeActivityList'
import { HomeCalendarList } from './components/HomeCalendarList'
import { HomeHeader } from './components/HomeHeader'
import { HomeWorldList } from './components/HomeWorldList'

export function HomeView() {
	return (
		<Stack width="100%" height="100%" alignItems="center" sx={{ overflowY: 'auto' }}>
			<Container maxWidth="lg" sx={{ pt: 4 }}>
				<HomeHeader />
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) 316px' },
						gap: 3,
						alignItems: 'start',
					}}
				>
					<Stack gap={3} minWidth={0} pb="50vh">
						<HomeWorldList />
						<HomeCalendarList />
					</Stack>
					<Box sx={{ position: 'sticky', top: 22 }}>
						<HomeActivityList />
					</Box>
				</Box>
			</Container>
			<DeleteWorldModal />
			<LeaveWorldModal />
		</Stack>
	)
}
