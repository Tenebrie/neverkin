import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings'
import Construction from '@mui/icons-material/Construction'
import Home from '@mui/icons-material/Home'
import PublicIcon from '@mui/icons-material/Public'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

import { TenebrieLogoInline } from '@/app/components/TenebrieLogo'
import { useCheckRouteMatch } from '@/router-utils/hooks/useCheckRouteMatch'

import { AnnouncementView } from '../../announcements/AnnouncementView'
import { getAuthState } from '../../auth/AuthSliceSelectors'
import { SmallProfile } from '../../auth/smallProfile/SmallProfile'
import { GlobalSearch } from '../../globalSearch/GlobalSearch'
import { ThemeModeToggle } from '../../theming/components/ThemeModeToggle'
import { CustomTheme, useCustomTheme } from '../../theming/hooks/useCustomTheme'
import { DocsNavigatorButton } from './DocsNavigatorButton'
import { HamburgerMenu } from './HamburgerMenu'
import { LandingPageNavigatorButton } from './LandingPageNavigatorButton'
import { LastWorldNavigatorButton } from './LastWorldNavigatorButton'
import { NavigatorButton } from './NavigatorButton'
import { WorldSelectorButton } from './WorldSelectorButton'

const Container = styled(Paper)<{ $theme: CustomTheme }>`
	width: calc(100% - 16px);
	background: ${(props) => props.$theme.custom.palette.background.navigator};
	box-shadow: 'none';
	display: flex;
	justify-content: space-between;
	border-radius: 0 !important;
	transition: background-color 1.3s;
	z-index: 10;
	padding: 2px 8px;
`

export const BaseNavigator = () => {
	const { user } = useSelector(getAuthState)
	const theme = useCustomTheme()
	const muiTheme = useTheme()
	const isNarrow = useMediaQuery(muiTheme.breakpoints.down('md'))
	const isCompact = useMediaQuery(muiTheme.breakpoints.down('lg'))

	const isShareLinkRoute = useCheckRouteMatch('/share/$shareLinkSlug')
	const isGuestLoginRoute = useCheckRouteMatch('/guest-login')
	if ((isShareLinkRoute || isGuestLoginRoute) && !user) {
		return null
	}

	return (
		<Container $theme={theme}>
			<Box>
				{user && (
					<Stack direction="row" height="100%" gap={1} alignItems="center">
						{isNarrow && <HamburgerMenu />}
						{!isNarrow && (
							<>
								<Stack
									minWidth={isCompact ? undefined : 173}
									direction="row"
									gap={1}
									sx={{ justifyContent: 'flex-start' }}
								>
									<WorldSelectorButton />
									<LastWorldNavigatorButton icon={<PublicIcon />} label="World" iconOnly={isCompact} />
								</Stack>
								<Divider orientation="vertical" sx={{ height: '20px' }} />
								<NavigatorButton
									route="/"
									icon={<Home />}
									label="Home"
									disabled={!user}
									iconOnly={isCompact}
								/>
							</>
						)}
						{!isNarrow && (
							<NavigatorButton
								route="/tools"
								icon={<Construction />}
								label="Tools"
								disabled={!user}
								iconOnly={isCompact}
							/>
						)}
						{!isNarrow && <DocsNavigatorButton iconOnly={isCompact} />}
						{!isNarrow && user?.level === 'Admin' && (
							<NavigatorButton
								route="/admin"
								icon={<AdminPanelSettings />}
								label="Admin"
								iconOnly={isCompact}
							/>
						)}
					</Stack>
				)}
				{!user && <LandingPageNavigatorButton icon={<TenebrieLogoInline />} label="Neverkin" />}
			</Box>
			<Stack direction="row" gap={2} alignItems="center" height={1}>
				<GlobalSearch />
				<ThemeModeToggle />
				{user && !isNarrow && <AnnouncementView />}
				<Divider orientation="vertical" sx={{ height: '20px' }} />
				<SmallProfile />
			</Stack>
		</Container>
	)
}
