import AccountCircle from '@mui/icons-material/AccountCircle'
import FeedbackIcon from '@mui/icons-material/Feedback'
import ImportExportIcon from '@mui/icons-material/ImportExport'
import LockResetIcon from '@mui/icons-material/LockReset'
import Logout from '@mui/icons-material/Logout'
import Storage from '@mui/icons-material/Storage'
import Tune from '@mui/icons-material/Tune'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks'

import { usePostLogoutMutation } from '@/api/authApi'
import { NavigationLink } from '@/app/components/NavigationLink'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { useCheckRouteMatch } from '@/router-utils/hooks/useCheckRouteMatch'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { User } from '../../AuthSlice'
import { useClearSession } from '../../hooks/useClearSession'

type Props = {
	user: User
}

export function UserDropdown({ user }: Props) {
	const navigate = useStableNavigate()
	const isProfile = useCheckRouteMatch('/profile/public')
	const isPreferences = useCheckRouteMatch('/profile/preferences')
	const isStorage = useCheckRouteMatch('/profile/storage')
	const isMigration = useCheckRouteMatch('/profile/migration')
	const isSecurity = useCheckRouteMatch('/profile/security')
	const isFeedback = useCheckRouteMatch('/profile/feedback')

	const theme = useTheme()
	const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

	const [logout] = usePostLogoutMutation()
	const clearSession = useClearSession()

	const onLogout = async () => {
		const result = parseApiResponse(await logout())
		if (result.error) {
			return
		}
		if (result.response.redirectTo === 'admin') {
			navigate({ to: '/admin/users', reloadDocument: true })
		} else {
			clearSession()
			navigate({ to: '/login' })
		}
	}

	const popupState = usePopupState({ variant: 'popover', popupId: 'profile-menu' })

	return (
		<Stack direction="row" alignItems="center" spacing={1}>
			{isSmallScreen && (
				<Button {...bindTrigger(popupState)} sx={{ padding: '4px 15px' }} data-testid="UserDropdownButton">
					<Avatar sx={{ height: 28, width: 28 }} src={user.avatarUrl} />
				</Button>
			)}
			{!isSmallScreen && (
				<Button
					startIcon={<Avatar sx={{ height: 28, width: 28 }} src={user.avatarUrl} />}
					{...bindTrigger(popupState)}
					sx={{ padding: '4px 15px' }}
					data-testid="UserDropdownButton"
				>
					{user.username}
				</Button>
			)}
			<Menu
				{...bindMenu(popupState)}
				sx={{
					'.MuiPaper-root': {
						minWidth: '250px',
					},
				}}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
			>
				<MenuItem disabled>
					<ListItemText primary={user.username} secondary={user.email} />
				</MenuItem>
				<Divider />
				<NavigationLink to="/profile">
					<MenuItem
						onClick={() => {
							popupState.close()
						}}
						selected={isProfile}
					>
						<ListItemIcon>
							<AccountCircle />
						</ListItemIcon>
						Profile
					</MenuItem>
				</NavigationLink>
				<NavigationLink to="/profile/preferences">
					<MenuItem
						onClick={() => {
							popupState.close()
						}}
						selected={isPreferences}
					>
						<ListItemIcon>
							<Tune />
						</ListItemIcon>
						Preferences
					</MenuItem>
				</NavigationLink>
				<NavigationLink to="/profile/storage">
					<MenuItem
						onClick={() => {
							popupState.close()
						}}
						selected={isStorage}
					>
						<ListItemIcon>
							<Storage />
						</ListItemIcon>
						Storage
					</MenuItem>
				</NavigationLink>
				<NavigationLink to="/profile/migration">
					<MenuItem
						onClick={() => {
							popupState.close()
						}}
						selected={isMigration}
					>
						<ListItemIcon>
							<ImportExportIcon />
						</ListItemIcon>
						Import / Export
					</MenuItem>
				</NavigationLink>
				<NavigationLink to="/profile/security">
					<MenuItem
						onClick={() => {
							popupState.close()
						}}
						selected={isSecurity}
					>
						<ListItemIcon>
							<LockResetIcon />
						</ListItemIcon>
						Security
					</MenuItem>
				</NavigationLink>
				<NavigationLink to="/profile/feedback">
					<MenuItem
						onClick={() => {
							popupState.close()
						}}
						selected={isFeedback}
					>
						<ListItemIcon>
							<FeedbackIcon />
						</ListItemIcon>
						Feedback
					</MenuItem>
				</NavigationLink>
				<Divider sx={{ my: 1 }} />
				<MenuItem
					onClick={() => {
						onLogout()
						popupState.close()
					}}
				>
					<ListItemIcon>
						<Logout />
					</ListItemIcon>
					Logout
				</MenuItem>
			</Menu>
		</Stack>
	)
}
