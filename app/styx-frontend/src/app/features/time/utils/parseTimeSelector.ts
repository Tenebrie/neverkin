import { parseFormattedTimestamp } from '@neverkin/esoteric-date'

import { WorldCalendar, WorldCalendarUnit } from '@/api/types/worldTypes'

type TimeBucket = {
	bucket: string
	names: string[]
	unit: WorldCalendarUnit
	toTimeMatchPattern: RegExp
	toDeltaMatchPattern: RegExp

	labeledMatchPatterns: {
		index: number
		pattern: RegExp
	}[]
}

type TimeDelta = {
	priority: number
	unit: WorldCalendarUnit | null
	set: number | null
	add: number
	exact?: boolean
}

const parseNumber = (str: string) => {
	if (str.match(/[0-9]+/)) {
		return parseInt(str)
	}
	return 0
}

export const parseTimeSelector = (calendar: WorldCalendar, timeSelector: string): TimeDelta[] => {
	const asDate = matchDateFormat(calendar, timeSelector)
	if (asDate) {
		return asDate
	}

	const parts = timeSelector.split(' ')
	const buckets = calendar.units
		.filter((unit) => unit.formatShorthand && unit.formatMode !== 'Hidden')
		.map((unit) => {
			const isCaseSensitive = calendar.units.some(
				(u) =>
					u.formatShorthand?.toLowerCase() === unit.formatShorthand?.toLowerCase() &&
					u.displayName !== unit.displayName,
			)

			const names = [unit.displayName.toLowerCase(), unit.displayNameShort.toLowerCase()].filter(
				(name) => name.length > 1,
			)
			const customLabels = unit.parents
				.filter((rel) => !!rel.label)
				.map((rel) => ({
					index: calendar.units
						.find((u) => u.id === rel.parentUnitId)!
						.children.findIndex((c) => c.id === rel.id),
					pattern: new RegExp(`^${rel.label}!?$`, 'i'),
				}))

			if (isCaseSensitive) {
				names.push(unit.formatShorthand!)
			} else {
				names.push(unit.formatShorthand!.toLowerCase())
				names.push(unit.formatShorthand!.toUpperCase())
			}

			const toTimeMatchPattern = new RegExp(`^(${names.join('|')})[-0-9]+!?$`)
			const toDeltaMatchPattern = new RegExp(`^[-0-9]+(${names.join('|')})!?$`)
			return {
				bucket: unit.displayName.toLowerCase(),
				names,
				unit,
				toTimeMatchPattern,
				toDeltaMatchPattern,
				labeledMatchPatterns: customLabels,
			}
		}) satisfies TimeBucket[]

	return parts.map<TimeDelta>((partial) => {
		const num = partial.replace(/[^-0-9\\.]/g, '')
		const exact = partial.endsWith('!')

		const toLabeledMatch = buckets
			.flatMap((parent) =>
				parent.labeledMatchPatterns.map((label) => ({
					...label,
					parent,
				})),
			)
			.find((label) => label.pattern.test(partial))

		if (toLabeledMatch) {
			return {
				bucket: toLabeledMatch.parent.bucket,
				priority: Number(toLabeledMatch.parent.unit.duration),
				unit: toLabeledMatch.parent.unit,
				set: toLabeledMatch.index,
				add: 0,
				exact,
			}
		}

		const toTimeMatch = buckets.find((bucket) => bucket.toTimeMatchPattern.test(partial))
		if (toTimeMatch) {
			return {
				bucket: toTimeMatch.bucket,
				priority: Number(toTimeMatch.unit.duration),
				unit: toTimeMatch.unit,
				set: toInternalValue(toTimeMatch.unit, parseNumber(num)),
				add: 0,
				exact,
			}
		}

		const toDeltaMatch = buckets.find((bucket) => bucket.toDeltaMatchPattern.test(partial))
		if (toDeltaMatch) {
			return {
				bucket: toDeltaMatch.bucket,
				priority: Number(toDeltaMatch.unit.duration),
				unit: toDeltaMatch.unit,
				set: null,
				add: parseNumber(num),
				exact,
			}
		}
		return {
			priority: 0,
			set: null,
			unit: null,
			add: 0,
		}
	})
}

/**
 * A selector written the way the world formats its dates, whole or in part:
 * `14:00 April 04, 2030` or just its leading `14:23`. Fields the selector doesn't
 * cover keep their current value, like every other selector.
 */
function matchDateFormat(calendar: WorldCalendar, timeSelector: string): TimeDelta[] | null {
	const formatted = timeSelector.trim()
	if (!calendar.dateFormat || formatted.length === 0) {
		return null
	}

	try {
		const parsed = parseFormattedTimestamp({
			allUnits: calendar.units,
			formatted,
			dateFormat: calendar.dateFormat,
			allowPartial: true,
		})
		return [...parsed]
			.flatMap<TimeDelta>(([unitId, entry]) => {
				const unit = calendar.units.find((candidate) => candidate.id === unitId)
				return unit ? [{ priority: Number(unit.duration), unit, set: entry.value, add: 0 }] : []
			})
			.sort((a, b) => b.priority - a.priority)
	} catch {
		return null
	}
}

/** Deltas carry internal indices; only some format modes render a unit one-indexed. */
function toInternalValue(unit: WorldCalendarUnit, displayed: number) {
	const isOneIndexed = unit.formatMode === 'NameOneIndexed' || unit.formatMode === 'NumericOneIndexed'
	return isOneIndexed && displayed >= 0 ? displayed - 1 : displayed
}
