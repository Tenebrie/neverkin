import Category from '@mui/icons-material/Category'
import Groups from '@mui/icons-material/Groups'
import Login from '@mui/icons-material/Login'
import PersonAdd from '@mui/icons-material/PersonAdd'
import Shield from '@mui/icons-material/Shield'
import Storage from '@mui/icons-material/Storage'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { ReactNode } from 'react'

import { AdminGetDashboardApiResponse, useAdminGetDashboardQuery } from '@/api/adminUsersApi'

import { AdminDashboardContentCards } from '../components/AdminDashboardContentCards'
import { AdminDashboardStatCard, StatCardSeries } from '../components/AdminDashboardStatCard'
import { AdminDashboardStorageCard } from '../components/AdminDashboardStorageCard'
import { AdminDashboardUserActivityChart } from '../components/AdminDashboardUserActivityChart'

export function AdminDashboardView() {
	const { data, fulfilledTimeStamp } = useAdminGetDashboardQuery(undefined, {
		pollingInterval: 30_000,
	})

	if (!data) {
		return <></>
	}

	const { auditStats, fileSystemStats } = data

	const StatCard = AdminDashboardStatCard
	const StorageCard = AdminDashboardStorageCard

	const series = (key: DailyStatKey, days = auditStats.daily.length): StatCardSeries =>
		auditStats.daily
			.slice(-days)
			.map((day) => ({ label: dayFormat.format(new Date(day.day)), value: day[key] }))
	const hourlySeries: StatCardSeries = auditStats.hourly.map((entry) => ({
		label: hourFormat.format(new Date(entry.hour)),
		value: entry.dailyActiveUsers,
	}))

	return (
		<Stack gap={2.5} width="100%" alignSelf="center">
			{fulfilledTimeStamp && (
				<Typography variant="caption" color="text.secondary" alignSelf="flex-end">
					Last updated: {new Date(fulfilledTimeStamp).toLocaleTimeString()}
				</Typography>
			)}
			<Section icon={<Groups color="primary" />} title="Active Users">
				<StatCard
					label="Daily"
					value={auditStats.dailyActiveUsers}
					sub="Last 24 hours"
					series={hourlySeries}
				/>
				<StatCard
					label="Weekly"
					value={auditStats.weeklyActiveUsers}
					sub="Last 7 days"
					series={series('weeklyActiveUsers', 7)}
				/>
				<StatCard
					label="Monthly"
					value={auditStats.monthlyActiveUsers}
					sub="Last 30 days"
					series={series('monthlyActiveUsers')}
				/>
				<StatCard
					label="Regulars"
					value={auditStats.regulars}
					sub="Last 30 days"
					series={series('regulars')}
				/>
				<AdminDashboardUserActivityChart activity={data.hourlyActivity} />
			</Section>

			<Section icon={<Category color="primary" />} title="Content">
				<AdminDashboardContentCards stats={data.contentStats} />
			</Section>

			<Section icon={<PersonAdd color="success" />} title="Accounts (30 Days)">
				<StatCard
					label="Guest Created"
					value={auditStats.guestAccountsCreated}
					series={series('guestAccountsCreated')}
				/>
				<StatCard
					label="User Created"
					value={auditStats.userAccountsCreated}
					series={series('userAccountsCreated')}
				/>
				<StatCard label="Deleted" value={auditStats.accountsDeleted} series={series('accountsDeleted')} />
			</Section>

			<Section icon={<Login color="info" />} title="Login Activity (30 Days)">
				<StatCard label="Auth" value={auditStats.userAuthEvents} series={series('userAuthEvents')} />
				<StatCard label="Password" value={auditStats.passwordLogins} series={series('passwordLogins')} />
				<StatCard label="Google" value={auditStats.googleLogins} series={series('googleLogins')} />
				<StatCard label="Failed" value={auditStats.failedLogins} series={series('failedLogins')} />
			</Section>

			<Section icon={<Shield color="warning" />} title="Total Activity (30 Days)">
				<StatCard
					label="Total Audited Events"
					value={auditStats.totalEvents}
					series={series('totalEvents')}
				/>
			</Section>

			<Section icon={<Storage color="secondary" />} title="Storage">
				<StorageCard label="Root" free={fileSystemStats.root.free} total={fileSystemStats.root.total} />
				<StorageCard
					label="Database"
					free={fileSystemStats.database.free}
					total={fileSystemStats.database.total}
				/>
			</Section>
		</Stack>
	)
}

type DailyStatKey = Exclude<keyof AdminGetDashboardApiResponse['auditStats']['daily'][number], 'day'>

const dayFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
const hourFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
	const theme = useTheme()
	return (
		<Paper
			variant="outlined"
			sx={{
				padding: 2.5,
				borderRadius: 2,
				background: theme.palette.background.default,
			}}
		>
			<Stack direction="row" alignItems="center" gap={1} marginBottom={2}>
				{icon}
				<Typography variant="subtitle1" fontWeight={600}>
					{title}
				</Typography>
			</Stack>
			<Stack direction="row" gap={2} flexWrap="wrap">
				{children}
			</Stack>
		</Paper>
	)
}
