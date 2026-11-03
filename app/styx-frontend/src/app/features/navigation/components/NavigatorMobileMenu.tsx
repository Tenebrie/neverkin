import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings'
import AutoStories from '@mui/icons-material/AutoStories'
import Construction from '@mui/icons-material/Construction'
import DescriptionIcon from '@mui/icons-material/Description'
import HomeIcon from '@mui/icons-material/Home'
import MenuIcon from '@mui/icons-material/Menu'
import OpenInNew from '@mui/icons-material/OpenInNew'
import Person from '@mui/icons-material/Person'
import Settings from '@mui/icons-material/Settings'
import Timeline from '@mui/icons-material/Timeline'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { NavigationLink } from '@/app/components/NavigationLink'
import { getWorldState } from '@/app/views/world/WorldSliceSelectors'
import { useCheckRouteMatch } from '@/router-utils/hooks/useCheckRouteMatch'
import { useCheckRouteMatchExact } from '@/router-utils/hooks/useCheckRouteMatchExact'

import { getAuthState } from '../../auth/AuthSliceSelectors'
import { getDocsUrl } from '../utils/getDocsUrl'

export function NavigatorMobileMenu() {
	const { user } = useSelector(getAuthState, (a, b) => a.user === b.user)
	const {
		id: worldId,
		name: worldName,
		isLoaded,
		isReadOnly,
	} = useSelector(
		getWorldState,
		(a, b) => a.id === b.id && a.isLoaded === b.isLoaded && a.isReadOnly === b.isReadOnly,
	)
	const [open, setOpen] = useState(false)
	const anchorRef = useRef<HTMLButtonElement>(null)

	const isHomeActive = useCheckRouteMatchExact('/')
	const isToolsActive = useCheckRouteMatch('/tools')
	const isAdminActive = useCheckRouteMatch('/admin')
	const isTimelineActive = useCheckRouteMatch('/world/$worldId/timeline')
	const isMindmapActive = useCheckRouteMatch('/world/$worldId/mindmap')
	const isWikiActive = useCheckRouteMatch('/world/$worldId/wiki')
	const isSettingsActive = useCheckRouteMatch('/world/$worldId/settings')

	const handleClose = () => setOpen(false)
	const hasWorld = isLoaded && !!user

	return (
		<>
			<IconButton ref={anchorRef} onClick={() => setOpen((v) => !v)} color="primary" aria-label="Menu">
				<MenuIcon />
			</IconButton>
			<Menu
				anchorEl={anchorRef.current}
				open={open}
				onClose={handleClose}
				slotProps={{
					paper: {
						sx: { marginTop: '6px', minWidth: 200 },
					},
				}}
			>
				<NavigationLink to="/">
					<MenuItem onClick={handleClose} selected={isHomeActive}>
						<ListItemIcon>
							<HomeIcon />
						</ListItemIcon>
						<ListItemText>Home</ListItemText>
					</MenuItem>
				</NavigationLink>
				<NavigationLink to="/tools" disabled={!user}>
					<MenuItem onClick={handleClose} disabled={!user} selected={isToolsActive}>
						<ListItemIcon>
							<Construction />
						</ListItemIcon>
						<ListItemText>Tools</ListItemText>
					</MenuItem>
				</NavigationLink>
				<MenuItem
					component="a"
					href={getDocsUrl()}
					target="_blank"
					rel="noopener noreferrer"
					onClick={handleClose}
				>
					<ListItemIcon>
						<DescriptionIcon />
					</ListItemIcon>
					<ListItemText>Docs</ListItemText>
					<OpenInNew sx={{ fontSize: 14, opacity: 0.6 }} />
				</MenuItem>
				{user?.level === 'Admin' && (
					<NavigationLink to="/admin">
						<MenuItem onClick={handleClose} selected={isAdminActive}>
							<ListItemIcon>
								<AdminPanelSettings />
							</ListItemIcon>
							<ListItemText>Admin</ListItemText>
						</MenuItem>
					</NavigationLink>
				)}
				{hasWorld && [
					<Divider key="divider-1" sx={{ my: 1 }} />,
					<MenuItem disabled key="last-word-label">
						<ListItemText
							primary={worldName}
							secondary="Last open world"
							slotProps={{ primary: { noWrap: true } }}
							sx={{ contain: 'inline-size' }}
						/>
					</MenuItem>,
					<Divider key="divider-2" sx={{ my: 0 }} />,
					<NavigationLink
						key="timeline"
						to="/world/$worldId/timeline"
						params={{ worldId }}
						search={true}
						from="/world/$worldId"
					>
						<MenuItem onClick={handleClose} selected={isTimelineActive}>
							<ListItemIcon>
								<Timeline />
							</ListItemIcon>
							<ListItemText>Timeline</ListItemText>
						</MenuItem>
					</NavigationLink>,
					<NavigationLink
						key="mindmap"
						to="/world/$worldId/mindmap"
						params={{ worldId }}
						search={true}
						from="/world/$worldId"
					>
						<MenuItem onClick={handleClose} selected={isMindmapActive}>
							<ListItemIcon>
								<Person />
							</ListItemIcon>
							<ListItemText>Mindmap</ListItemText>
						</MenuItem>
					</NavigationLink>,
					<NavigationLink
						key="wiki"
						to="/world/$worldId/wiki"
						params={{ worldId }}
						search={true}
						from="/world/$worldId"
					>
						<MenuItem onClick={handleClose} selected={isWikiActive}>
							<ListItemIcon>
								<AutoStories />
							</ListItemIcon>
							<ListItemText>Wiki</ListItemText>
						</MenuItem>
					</NavigationLink>,
					...(!isReadOnly
						? [
								<NavigationLink
									key="settings"
									to="/world/$worldId/settings"
									params={{ worldId }}
									search={true}
									from="/world/$worldId"
								>
									<MenuItem onClick={handleClose} selected={isSettingsActive}>
										<ListItemIcon>
											<Settings />
										</ListItemIcon>
										<ListItemText>Settings</ListItemText>
									</MenuItem>
								</NavigationLink>,
							]
						: []),
				]}
			</Menu>
		</>
	)
}
