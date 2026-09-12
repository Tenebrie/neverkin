import { pluralize } from './pluralize'

export function formatTimeAgo(date: Date): string {
	const diffMs = Date.now() - date.getTime()
	const abs = Math.abs(diffMs)
	const past = diffMs > 0

	if (abs <= MINUTE_MS) {
		return past ? 'just now' : 'in a moment'
	}

	const index = UNITS.findIndex((unit, i) => {
		const next = UNITS[i + 1]
		return !next || Math.round(abs / unit.ms) <= next.ms / unit.ms
	})
	const unit = UNITS[index]
	const suffix = past ? 'ago' : 'from now'
	return `${pluralize(Math.round(abs / unit.ms), unit.noun)} ${suffix}`
}

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

const UNITS = [
	{ noun: 'minute', ms: MINUTE_MS },
	{ noun: 'hour', ms: HOUR_MS },
	{ noun: 'day', ms: DAY_MS },
	{ noun: 'week', ms: 7 * DAY_MS },
	{ noun: 'month', ms: 30 * DAY_MS },
	{ noun: 'year', ms: 365 * DAY_MS },
]
