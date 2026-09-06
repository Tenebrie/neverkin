import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AdminUserEmail } from './AdminUserEmail'

type Props = {
	user: {
		id: string
		username: string
		email: string
	}
}

export function AdminUserSummary({ user }: Props) {
	return (
		<Stack gap={0}>
			<Typography variant="body2" noWrap sx={{ fontSize: '0.8125rem' }}>
				{user.username}
			</Typography>
			<Stack sx={{ fontSize: '0.8125rem' }}>
				<AdminUserEmail user={user} />
			</Stack>
		</Stack>
	)
}
