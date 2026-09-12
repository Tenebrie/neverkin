import Stack from '@mui/material/Stack'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { useCallback, useState } from 'react'
import { useSelector } from 'react-redux'

import { useAdminGetUsersQuery } from '@/api/adminUsersApi'
import { getAuthState } from '@/app/features/auth/AuthSliceSelectors'

import { Pagination } from '../../../../ui-lib/components/Pagination/Pagination'
import { AdminUserRow } from '../components/AdminUserRow'
import { SearchInput } from '../components/SearchInput'
import { DeleteUserModal } from '../modals/DeleteUserModal'
import { FeatureFlagModal } from '../modals/FeatureFlagModal'
import { SetPasswordModal } from '../modals/SetPasswordModal'

const pageSize = 18

export function AdminUsersView() {
	const [page, setPage] = useState(0)
	const [query, setQuery] = useState('')

	const { data } = useAdminGetUsersQuery({
		page,
		size: pageSize,
		query,
	})

	const { user: loggedInUser } = useSelector(getAuthState)

	const formatDate = useCallback((date: string) => {
		return new Date(date).toLocaleString('en-US', {
			year: 'numeric', // e.g., '2023'
			month: 'short', // e.g., 'Oct'
			day: 'numeric', // e.g., '27'
			hour: '2-digit', // e.g., '08'
			minute: '2-digit', // e.g., '30'
			second: '2-digit', // e.g., '45'
			hour12: false, // AM/PM format
		})
	}, [])

	if (!data || !loggedInUser) {
		return <></>
	}

	return (
		<>
			<Stack
				sx={{ padding: '16px 16px' }}
				direction="row"
				gap={1}
				justifyContent="space-between"
				width="calc(100% - 32px)"
				alignItems="center"
			>
				<Stack flexBasis="10%" />
				<Stack alignItems="center" sx={{ flexBasis: '33.3333%' }}>
					<Pagination initialPage={page} pageCount={data.pageCount} onChange={setPage} />
				</Stack>
				<SearchInput
					initialQuery={query}
					onChange={(value: string) => {
						setQuery(value)
						setPage(0)
					}}
				/>
			</Stack>
			<Stack component="span">
				<TableContainer component="table">
					<TableHead>
						<TableRow>
							<TableCell width={250}>Email</TableCell>
							<TableCell width={200}>Username</TableCell>
							<TableCell width={82}>Level</TableCell>
							<TableCell width={170}>Activity (30 Days)</TableCell>
							<TableCell width={160}>Created At</TableCell>
							<TableCell width={160}>Updated At</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{data.users.map((user) => (
							<AdminUserRow
								key={user.id}
								user={user}
								isLoggedInUser={loggedInUser.id === user.id}
								formatDate={formatDate}
							/>
						))}
					</TableBody>
				</TableContainer>
			</Stack>
			<DeleteUserModal />
			<FeatureFlagModal />
			<SetPasswordModal />
		</>
	)
}
