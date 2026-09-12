import DeleteIcon from '@mui/icons-material/Delete'
import FlagIcon from '@mui/icons-material/Flag'
import LoginIcon from '@mui/icons-material/Login'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PasswordIcon from '@mui/icons-material/Password'
import Badge from '@mui/material/Badge'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import { useState } from 'react'

import { AdminGetUsersApiResponse, useAdminGetFeatureFlagsQuery } from '@/api/adminUsersApi'
import { useModal } from '@/app/features/modals/ModalsSlice'
import { Info } from '@/ui-lib/components/Info/Info'

import { useAdminImpersonateUser } from '../api/useAdminImpersonateUser'
import { AdminUserEmail } from './AdminUserEmail'
import { UserAccessLevelDropdown } from './UserAccessLevelDropdown'

type Props = {
	user: AdminGetUsersApiResponse['users'][number]
	isLoggedInUser: boolean
	formatDate: (date: string) => string
}

export function AdminUserRow({ user, isLoggedInUser, formatDate }: Props) {
	return (
		<TableRow sx={{ height: '75px' }}>
			<TableCell>
				<AdminUserEmail user={user} editable />
			</TableCell>
			<TableCell>
				<Stack direction="row" alignItems="center" gap={1}>
					{user.username} {isLoggedInUser && <Info value="Despite everything, it's still you" />}
					<AdminUserRowActionsMenu user={user} isLoggedInUser={isLoggedInUser} />
				</Stack>
			</TableCell>
			<TableCell>
				<UserAccessLevelDropdown user={user} />
			</TableCell>
			<TableCell>
				<Stack direction="row" alignItems="center" gap={1}>
					<Tooltip
						title={
							user.activity.lastActiveAt
								? `Last seen ${formatDate(user.activity.lastActiveAt)}`
								: 'No activity in the last 30 days'
						}
						disableInteractive
					>
						<span>{user.activity.activeDays} days</span>
					</Tooltip>
					{user.activity.regular && <Chip label="Regular" size="small" color="primary" variant="outlined" />}
				</Stack>
			</TableCell>
			<TableCell>{formatDate(user.createdAt)}</TableCell>
			<TableCell>{formatDate(user.updatedAt)}</TableCell>
		</TableRow>
	)
}

function AdminUserRowActionsMenu({
	user,
	isLoggedInUser,
}: {
	user: AdminGetUsersApiResponse['users'][number]
	isLoggedInUser: boolean
}) {
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

	const { open: openDeleteUserModal } = useModal('deleteUserModal')
	const { open: openSetPasswordModal } = useModal('setPasswordModal')
	const { open: openFeatureFlagModal } = useModal('featureFlagModal')
	const [impersonateUser] = useAdminImpersonateUser()

	const { data: userFlags } = useAdminGetFeatureFlagsQuery({ userId: user.id })
	const flagCount = userFlags?.length ?? 0

	return (
		<>
			{flagCount > 0 && (
				<Tooltip title="Feature flags enabled">
					<IconButton size="small" onClick={() => openFeatureFlagModal({ targetUser: user })}>
						<Badge badgeContent={flagCount} color="primary">
							<FlagIcon fontSize="small" />
						</Badge>
					</IconButton>
				</Tooltip>
			)}
			<IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
				<MoreVertIcon fontSize="small" />
			</IconButton>
			<Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
				{!isLoggedInUser && (
					<MenuItem
						onClick={() => {
							impersonateUser(user.id)
							setMenuAnchor(null)
						}}
					>
						<ListItemIcon>
							<LoginIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>Login as</ListItemText>
					</MenuItem>
				)}
				<MenuItem
					onClick={() => {
						openSetPasswordModal({ targetUser: user })
						setMenuAnchor(null)
					}}
				>
					<ListItemIcon>
						<PasswordIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>Set password</ListItemText>
				</MenuItem>
				<MenuItem
					onClick={() => {
						openFeatureFlagModal({ targetUser: user })
						setMenuAnchor(null)
					}}
				>
					<ListItemIcon>
						<FlagIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>Manage feature flags</ListItemText>
				</MenuItem>
				{!isLoggedInUser && (
					<MenuItem
						onClick={() => {
							openDeleteUserModal({ targetUser: user })
							setMenuAnchor(null)
						}}
					>
						<ListItemIcon>
							<DeleteIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText>Delete</ListItemText>
					</MenuItem>
				)}
			</Menu>
		</>
	)
}
