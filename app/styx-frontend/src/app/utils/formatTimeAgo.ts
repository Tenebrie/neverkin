import { pluralize } from './pluralize'

export function formatTimeAgo(date: Date): string {
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const abs = Math.abs(diffMs)
	const past = diffMs > 0

	const seconds = Math.round(abs / 1000)
	const minutes = Math.round(seconds / 60)
	const hours = Math.round(minutes / 60)
	const days = Math.round(hours / 24)

	const suffix = past ? 'ago' : 'from now'

	if (seconds <= 60) {
		return past ? 'just now' : 'in a moment'
	} else if (minutes <= 60) {
		return `${pluralize(minutes, 'minute')} ${suffix}`
	} else if (hours <= 24) {
		return `${pluralize(hours, 'hour')} ${suffix}`
	} else if (days <= 7) {
		return `${pluralize(days, 'day')} ${suffix}`
	} else {
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	}
}
