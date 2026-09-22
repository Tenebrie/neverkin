import Box from '@mui/material/Box'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'
import styled from 'styled-components'

import { AnnouncementSnackbar } from './features/announcements/AnnouncementSnackbar'
import { AuthBackground } from './features/auth/components/AuthBackground'
import { DragDropPortalSlot } from './features/dragDrop/components/GhostWrapper'
import { EventBusProvider } from './features/eventBus'
import { globalEventBus } from './features/eventBus/eventBus'
import { LostConnectionAlert } from './features/liveUpdates/components/LostConnectionAlert'
import { useLiveUpdates } from './features/liveUpdates/hooks/useLiveUpdates'
import { BaseNavigator } from './features/navigation/components/BaseNavigator'
import { NavigationReceiverWrapper } from './features/navigation/components/NavigationReceiverWrapper'
import { PageMetadata } from './features/pageMetadata/PageMetadata'
import { useSavedPreferences } from './features/preferences/hooks/useSavedPreferences'
import { CustomThemeOverrides } from './features/theming/components/CustomThemeOverrides'
import { CustomThemeProvider } from './features/theming/context/CustomThemeProvider'
import { UndoRedoManager } from './features/undoRedo/UndoRedoManager'
import { useBrowserSpecificScrollbars } from './hooks/useBrowserSpecificScrollbars'
import { useCloseMenusOnRightClick } from './hooks/useCloseMenusOnRightClick'
import { useShortcutManager } from './hooks/useShortcut/useShortcutManager'
import { DeleteAccountModal } from './views/profile/modals/DeleteAccountModal'
import { DeleteAssetModal } from './views/profile/modals/DeleteAssetModal'
import { TimelineZoomReporter } from './views/world/views/timeline/components/TimelineZoomReporter'

const Container = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100vw;
	height: calc(100vh);
`

const App = () => {
	useLiveUpdates()
	useSavedPreferences()
	useShortcutManager()
	useCloseMenusOnRightClick()
	const scrollbars = useBrowserSpecificScrollbars()

	useEffect(() => {
		if (process.env.NODE_ENV === 'development') {
			window.document.title = 'Neverkin (Dev)'
		} else if (
			window.location.hostname === 'staging.tenebrie.com' ||
			window.location.hostname === 'staging.neverkin.com'
		) {
			window.document.title = 'Neverkin (Staging)'
		}
	}, [])

	useEffect(() => {
		const clearMouseBusy = () => {
			requestAnimationFrame(() => {
				window.document.body.classList.remove('mouse-busy', 'cursor-grabbing')
			})
		}
		window.addEventListener('mouseup', clearMouseBusy)
		window.addEventListener('mouseleave', clearMouseBusy)
		return () => {
			window.removeEventListener('mouseup', clearMouseBusy)
			window.removeEventListener('mouseleave', clearMouseBusy)
		}
	})

	return (
		<div className="App">
			<EventBusProvider bus={globalEventBus}>
				<LocalizationProvider dateAdapter={AdapterDayjs}>
					<CustomThemeProvider>
						<CustomThemeOverrides>
							<Container>
								<BaseNavigator />
								<Box
									sx={{
										width: '100%',
										flex: 1,
										minHeight: 0,
										overflowY: 'auto',
									}}
								>
									<AuthBackground>
										<Outlet />
									</AuthBackground>
								</Box>
								<DeleteAccountModal />
								<DeleteAssetModal />
							</Container>
							<LostConnectionAlert server="rhea" />
							<LostConnectionAlert server="calliope" />
							<AnnouncementSnackbar />
							<DragDropPortalSlot />
						</CustomThemeOverrides>
					</CustomThemeProvider>
					<NavigationReceiverWrapper />
					<PageMetadata />
					<TimelineZoomReporter />
					<UndoRedoManager />
					{/* <SummonableDebug /> */}
				</LocalizationProvider>
			</EventBusProvider>
		</div>
	)
}

export default App
