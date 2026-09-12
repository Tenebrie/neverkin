import Paper from '@mui/material/Paper'
import { Theme, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { BarChart } from '@mui/x-charts/BarChart'

import { AdminGetDashboardApiResponse } from '@/api/adminUsersApi'

type ActivitySeries = keyof typeof SERIES

type Props = {
	activity: AdminGetDashboardApiResponse['hourlyActivity']
	series?: ActivitySeries[]
}

export function AdminDashboardUserActivityChart({ activity, series = ['activeUsers', 'events'] }: Props) {
	const theme = useTheme()
	const hours = activity.map((entry) => new Date(entry.hour))
	const peak = Math.max(4, ...activity.flatMap((entry) => series.map((key) => entry[key])))

	return (
		<Paper
			variant="outlined"
			sx={{
				padding: '16px 20px 8px',
				flex: '1 1 100%',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<Typography variant="body2" color="text.secondary">
				Hourly activity
			</Typography>
			<BarChart
				height={240}
				borderRadius={3}
				margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
				grid={{ horizontal: true }}
				slotProps={{ legend: { toggleVisibilityOnClick: true } }}
				xAxis={[
					{
						scaleType: 'band',
						data: hours,
						categoryGapRatio: 0.25,
						barGapRatio: 0.1,
						tickInterval: (value: Date) => value.getHours() % 6 === 0,
						valueFormatter: (value: Date, context) =>
							context.location === 'tick' ? formatTick(value) : formatFull(value),
					},
				]}
				yAxis={[{ width: 36, min: 0, max: peak, tickNumber: 4 }]}
				series={series.map((key) => ({
					data: activity.map((entry) => entry[key]),
					label: SERIES[key].label,
					color: SERIES[key].color(theme),
				}))}
			/>
		</Paper>
	)
}

const SERIES = {
	activeUsers: { label: 'Active users', color: (theme: Theme) => theme.palette.primary.main },
	events: { label: 'Audit events', color: (theme: Theme) => theme.palette.info.main },
}

const hourFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })
const dayFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
const fullFormat = new Intl.DateTimeFormat(undefined, {
	weekday: 'short',
	month: 'short',
	day: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
})

function formatTick(value: Date) {
	return value.getHours() === 0 ? dayFormat.format(value) : hourFormat.format(value)
}

function formatFull(value: Date) {
	return fullFormat.format(value)
}
