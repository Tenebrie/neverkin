import ExpandMore from '@mui/icons-material/ExpandMore'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useCallback, useState } from 'react'

import { AdminGetAuditLogsApiResponse, useAdminGetAuditLogsQuery } from '@/api/adminUsersApi'

import { Pagination } from '../../../../ui-lib/components/Pagination/Pagination'
import { AdminUserSummary } from '../components/AdminUserSummary'
import { SearchInput } from '../components/SearchInput'

const pageSize = 20

type AuditLogMessage = AdminGetAuditLogsApiResponse['logs'][number]['action']

const actionColors: Record<AuditLogMessage, 'default' | 'success' | 'info' | 'warning' | 'error'> = {
	UserAuth: 'info',
	UserCreateAccount: 'success',
	UserLoginWithPassword: 'info',
	UserLoginWithGoogle: 'info',
	UserLoginFailed: 'warning',
	UserDeleteAccount: 'error',
	GuestCreateAccount: 'success',
	AdminImpersonateUser: 'warning',
	AdminUpdateUser: 'default',
	AdminSetUserLevel: 'default',
	AdminSetUserPassword: 'warning',
	AdminDeleteUser: 'error',
	AdminBroadcastNotification: 'default',
	UserExportData: 'info',
	UserExportDataFailed: 'warning',
	UserValidateImportData: 'info',
	UserValidateImportDataFailed: 'warning',
	UserImportData: 'success',
	UserImportDataFailed: 'error',
}

type AuditLog = AdminGetAuditLogsApiResponse['logs'][number]

function AuditLogRow({ log, formatDate }: { log: AuditLog; formatDate: (date: string) => string }) {
	const [expanded, setExpanded] = useState(false)

	return (
		<>
			<TableRow sx={{ '& > td': { borderBottom: 'none' } }}>
				<TableCell width={40} sx={{ padding: '0 0 0 8px' }}>
					<IconButton size="small" onClick={() => setExpanded((v) => !v)}>
						<ExpandMore
							sx={{
								transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
								transition: 'transform 0.2s',
							}}
						/>
					</IconButton>
				</TableCell>
				<TableCell width={180}>{formatDate(log.createdAt)}</TableCell>
				<TableCell width={220}>
					<Chip
						label={log.action}
						size="small"
						color={actionColors[log.action] ?? 'default'}
						variant="outlined"
					/>
				</TableCell>
				<TableCell width={220} sx={{ py: 0.75 }}>
					{log.user && <AdminUserSummary user={log.user} />}
					{!log.user && <span>—</span>}
				</TableCell>
				<TableCell>
					<Typography variant="body2" fontFamily="monospace">
						{log.requestIp}
					</Typography>
				</TableCell>
			</TableRow>
			<TableRow>
				<TableCell sx={{ padding: 0 }} colSpan={5}>
					<Collapse in={expanded} timeout="auto" unmountOnExit>
						<Typography
							variant="body2"
							fontFamily="monospace"
							component="pre"
							sx={{ padding: '8px 16px 16px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
						>
							{JSON.stringify(JSON.parse(log.data), null, 2)}
						</Typography>
					</Collapse>
				</TableCell>
			</TableRow>
		</>
	)
}

export function AdminAuditView() {
	const [page, setPage] = useState(0)
	const [query, setQuery] = useState('')

	const { data } = useAdminGetAuditLogsQuery({
		page,
		size: pageSize,
		query,
	})

	const formatDate = useCallback((date: string) => {
		return new Date(date).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
		})
	}, [])

	if (!data) {
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
							<TableCell width={40} />
							<TableCell width={180}>Timestamp</TableCell>
							<TableCell width={220}>Action</TableCell>
							<TableCell width={220}>User</TableCell>
							<TableCell>IP</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{data.logs.map((log) => (
							<AuditLogRow key={log.id} log={log} formatDate={formatDate} />
						))}
					</TableBody>
				</TableContainer>
			</Stack>
		</>
	)
}
