import Person from '@mui/icons-material/Person'
import Typography from '@mui/material/Typography'

import { AdminGetUserApiResponse } from '@/api/adminUsersApi'
import { CopyableText } from '@/ui-lib/components/CopyableText/CopyableText'

import { AdminDashboardSection } from './AdminDashboardSection'
import { AdminUserEmail } from './AdminUserEmail'
import { AdminUserHeaderField } from './AdminUserHeaderField'
import { UserAccessLevelDropdown } from './UserAccessLevelDropdown'

type Props = {
	user: AdminGetUserApiResponse['user']
}

export function AdminUserHeader({ user }: Props) {
	return (
		<AdminDashboardSection icon={<Person color="primary" />} title={user.username}>
			<AdminUserHeaderField label="Email">
				<AdminUserEmail user={user} editable />
			</AdminUserHeaderField>
			<AdminUserHeaderField label="Level" width={220}>
				<UserAccessLevelDropdown user={user} />
			</AdminUserHeaderField>
			<AdminUserHeaderField label="Joined" width={200}>
				<Typography variant="body1">{dateFormat.format(new Date(user.createdAt))}</Typography>
			</AdminUserHeaderField>
			<AdminUserHeaderField label="User ID">
				<CopyableText value={user.id} variant="body2" fontFamily="monospace" />
			</AdminUserHeaderField>
		</AdminDashboardSection>
	)
}

const dateFormat = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
