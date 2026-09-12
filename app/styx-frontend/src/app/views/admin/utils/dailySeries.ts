import { StatCardSeries } from '../components/AdminDashboardStatCard'

export function dailySeries<K extends string>(
	daily: NoInfer<({ day: string } & Record<K, number>)[]>,
	key: K,
	days = daily.length,
): StatCardSeries {
	return daily.slice(-days).map((day) => ({ label: dayFormat.format(new Date(day.day)), value: day[key] }))
}

const dayFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
