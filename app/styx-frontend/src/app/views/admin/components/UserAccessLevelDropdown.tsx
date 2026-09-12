import Cancel from '@mui/icons-material/Cancel'
import Save from '@mui/icons-material/Save'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import { useCallback, useState } from 'react'
import { useSelector } from 'react-redux'

import { useAdminSetUserLevelMutation } from '@/api/adminUsersApi'
import { useAdminGetUserLevelsQuery } from '@/api/otherApi'
import { User } from '@/app/features/auth/AuthSlice'
import { getAuthState } from '@/app/features/auth/AuthSliceSelectors'

type Props = {
	user: User
}

export const UserAccessLevelDropdown = ({ user }: Props) => {
	const [dropdownVisible, setDropdownVisible] = useState(false)
	const [dropdownValue, setDropdownValue] = useState<User['level']>(user.level)

	const { user: loggedInUser } = useSelector(getAuthState)

	const { data: levels } = useAdminGetUserLevelsQuery()

	const [setUserLevel] = useAdminSetUserLevelMutation()

	const onCommitUserLevel = useCallback(async () => {
		if (dropdownValue === user.level) {
			setDropdownVisible(false)
			return
		}
		await setUserLevel({
			userId: user.id,
			body: {
				level: dropdownValue,
			},
		})
		setDropdownVisible(false)
	}, [dropdownValue, setUserLevel, user.id, user.level])

	const onResetUserLevel = useCallback(async () => {
		setDropdownValue(user.level)
		setDropdownVisible(false)
	}, [user.level])

	const onEdit = useCallback(() => setDropdownVisible(true), [])

	if (!loggedInUser || !levels) {
		return <></>
	}

	return (
		<>
			{!dropdownVisible && (
				<Button
					onClick={onEdit}
					disabled={loggedInUser.id === user.id}
					sx={{ width: '100%', paddingLeft: 1, marginLeft: -1, justifyContent: 'flex-start' }}
				>
					{user.level}
				</Button>
			)}
			{dropdownVisible && (
				<Stack direction="row" gap={0.5}>
					<FormControl style={{ width: '115px' }}>
						<Select
							value={dropdownValue}
							onChange={(event) => setDropdownValue(event.target.value as User['level'])}
							size="small"
						>
							{levels.map((option) => (
								<MenuItem key={option} value={option}>
									{option}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<IconButton size="small" onClick={onCommitUserLevel} color="primary">
						<Save />
					</IconButton>
					<IconButton size="small" onClick={onResetUserLevel}>
						<Cancel />
					</IconButton>
				</Stack>
			)}
		</>
	)
}
