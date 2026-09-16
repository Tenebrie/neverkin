import ArrowBack from '@mui/icons-material/ArrowBack'
import Category from '@mui/icons-material/Category'
import Groups from '@mui/icons-material/Groups'
import Login from '@mui/icons-material/Login'
import Shield from '@mui/icons-material/Shield'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AdminGetUserApiResponse, useAdminGetUserQuery } from '@/api/adminUsersApi'
import { NavigationLink } from '@/app/components/NavigationLink'

import { AdminDashboardContentCards } from '../components/AdminDashboardContentCards'
import { AdminDashboardSection } from '../components/AdminDashboardSection'
import { AdminDashboardStatCard } from '../components/AdminDashboardStatCard'
import { AdminDashboardUserActivityChart } from '../components/AdminDashboardUserActivityChart'
import { AdminUserHeader } from '../components/AdminUserHeader'
import { dailySeries } from '../utils/dailySeries'

type Props = {
	userId: string
}

export function AdminUserView({ userId }: Props) {
	const { data, fulfilledTimeStamp } = useAdminGetUserQuery({ userId }, { pollingInterval: 30_000 })

	if (!data) {
		return <></>
	}

	const { user, auditStats } = data

	const Section = AdminDashboardSection
	const StatCard = AdminDashboardStatCard

	const series = (key: DailyStatKey, days?: number) => dailySeries(auditStats.daily, key, days)

	return (
		<Stack gap={2.5} width="100%" alignSelf="center">
			<Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
				<NavigationLink to="/admin/users">
					<Button startIcon={<ArrowBack />} sx={{ flex: 1, justifyContent: 'flex-start' }}>
						Back to users
					</Button>
				</NavigationLink>
				{fulfilledTimeStamp && (
					<Typography variant="caption" color="text.secondary">
						Last updated: {new Date(fulfilledTimeStamp).toLocaleTimeString()}
					</Typography>
				)}
			</Stack>
			<AdminUserHeader user={user} />

			<Section icon={<Groups color="primary" />} title="Activity">
				<StatCard
					label="Active Days"
					value={auditStats.activeUserDays}
					sub="Last 30 days"
					series={series('dailyActiveUsers')}
				/>
				<StatCard
					label="Last Seen"
					value={auditStats.lastActiveAt ? dateTimeFormat.format(new Date(auditStats.lastActiveAt)) : '—'}
					sub={auditStats.lastActiveAt ? undefined : 'No activity in the last 60 days'}
				/>
				<AdminDashboardUserActivityChart activity={data.hourlyActivity} series={['events']} />
			</Section>

			<Section icon={<Category color="primary" />} title="Content">
				<AdminDashboardContentCards stats={data.contentStats} />
			</Section>

			<Section icon={<Login color="info" />} title="Login Activity (30 Days)">
				<StatCard label="Auth" value={auditStats.userAuthEvents} series={series('userAuthEvents')} />
				<StatCard label="Password" value={auditStats.passwordLogins} series={series('passwordLogins')} />
				<StatCard label="Google" value={auditStats.googleLogins} series={series('googleLogins')} />
			</Section>

			<Section icon={<Shield color="warning" />} title="Total Activity (30 Days)">
				<StatCard
					label="Total Audited Events"
					value={auditStats.totalEvents}
					series={series('totalEvents')}
				/>
			</Section>
		</Stack>
	)
}

type DailyStatKey = Exclude<keyof AdminGetUserApiResponse['auditStats']['daily'][number], 'day'>

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
	month: 'short',
	day: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
})
