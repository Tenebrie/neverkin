import Category from '@mui/icons-material/Category'
import Groups from '@mui/icons-material/Groups'
import Login from '@mui/icons-material/Login'
import PersonAdd from '@mui/icons-material/PersonAdd'
import Shield from '@mui/icons-material/Shield'
import Storage from '@mui/icons-material/Storage'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AdminGetDashboardApiResponse, useAdminGetDashboardQuery } from '@/api/adminUsersApi'

import { AdminDashboardContentCards } from '../components/AdminDashboardContentCards'
import { AdminDashboardSection } from '../components/AdminDashboardSection'
import { AdminDashboardStatCard, StatCardSeries } from '../components/AdminDashboardStatCard'
import { AdminDashboardStorageCard } from '../components/AdminDashboardStorageCard'
import { AdminDashboardUserActivityChart } from '../components/AdminDashboardUserActivityChart'
import { dailySeries } from '../utils/dailySeries'

export function AdminDashboardView() {
	const { data, fulfilledTimeStamp } = useAdminGetDashboardQuery(undefined, {
		pollingInterval: 30_000,
	})

	if (!data) {
		return <></>
	}

	const { auditStats, fileSystemStats } = data

	const Section = AdminDashboardSection
	const StatCard = AdminDashboardStatCard
	const StorageCard = AdminDashboardStorageCard

	const series = (key: DailyStatKey, days?: number) => dailySeries(auditStats.daily, key, days)
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

const hourFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })
