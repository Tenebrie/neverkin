import {
	AnyCalendarUnit as AnyUnit,
	getCalendarModel,
	isVisible,
	unitBucket,
} from '../model/CalendarModel.js'
import { InputParsedTimestamp } from '../types.js'

interface LabelTarget {
	unitId: string
	value: number
}

interface Slot {
	unit: AnyUnit
	symbolCount: number
	labels?: Map<string, LabelTarget>
}

/** One run of the date format: a unit field, or the literal text between fields. */
interface Segment {
	literal: string
	slot: Slot | null
}

/** A segment with its regular expression source; fields capture exactly one group. */
interface CompiledSegment {
	source: string
	slot: Slot | null
}

export function parseFormattedTimestamp({
	allUnits,
	formatted,
	dateFormat,
	allowPartial = false,
}: {
	allUnits: AnyUnit[]
	formatted: string
	dateFormat: string
	/**
	 * Also accept a string covering only a contiguous run of the format's fields,
	 * such as the leading `hh:mm` of `hh:mm MM DD, YYYY`.
	 */
	allowPartial?: boolean
}): InputParsedTimestamp {
	const labelTargets = buildLabelTargets(allUnits)
	const segments: Segment[] = []

	const appendUnit = (unit: AnyUnit, symbolCount: number) => {
		const isNumeric = unit.formatMode === 'Numeric' || unit.formatMode === 'NumericOneIndexed'
		const isSymbolic = unit.formatMode === 'Name' || unit.formatMode === 'NameOneIndexed'
		// Hidden units render to an empty string — nothing to capture.
		if (!isNumeric && !isSymbolic) {
			return
		}

		segments.push({
			literal: '',
			slot: { unit, symbolCount, labels: isSymbolic ? labelTargets.get(unitBucket(unit)) : undefined },
		})
	}

	const flush = (symbol: string, count: number) => {
		if (symbol.length === 0) {
			return
		}

		const formatHasBothCases =
			dateFormat.includes(symbol.toLowerCase()) && dateFormat.includes(symbol.toUpperCase())
		const multipleUnitsShareLetter =
			allUnits.filter((u) => u.formatShorthand?.toLowerCase() === symbol.toLowerCase()).length > 1
		const caseSensitive = formatHasBothCases || multipleUnitsShareLetter

		const unit = allUnits.find((u) => {
			if (!u.formatShorthand) {
				return false
			}
			if (caseSensitive) {
				return u.formatShorthand === symbol
			}
			return u.formatShorthand.toLowerCase() === symbol.toLowerCase()
		})

		if (unit) {
			appendUnit(unit, count)
		} else {
			segments.push({ literal: symbol.repeat(count), slot: null })
		}
	}

	// Group the format string into runs of identical characters (mirrors format).
	let symbol = ''
	let count = 0
	for (const char of dateFormat) {
		if (char === symbol) {
			count += 1
		} else {
			flush(symbol, count)
			symbol = char
			count = 1
		}
	}
	flush(symbol, count)

	const matched = matchSegments(compile(segments), formatted, allowPartial)
	if (!matched) {
		throw new Error(`Cannot parse "${formatted}" using date format "${dateFormat}"`)
	}
	const { match, slots } = matched

	const result: InputParsedTimestamp = new Map()
	const seenShorthand = new Set<string>()
	slots.forEach((slot, index) => {
		const shorthand = slot.unit.formatShorthand
		// One value per shorthand: a symbol repeated in the format renders the
		// same unit twice, and resolveParsedTimestamp would double-count it.
		if (!shorthand || seenShorthand.has(shorthand)) {
			return
		}
		seenShorthand.add(shorthand)

		const captured = match[index + 1]

		const target = slot.labels?.get(captured.toLowerCase())
		if (target) {
			result.set(target.unitId, { value: target.value, formatShorthand: shorthand })
			return
		}

		const numeric = captured.match(/-?\d+$/)
		const displayed = Number.parseInt(numeric ? numeric[0] : captured, 10)
		const isOneIndexed =
			slot.unit.formatMode === 'NumericOneIndexed' || slot.unit.formatMode === 'NameOneIndexed'
		// Undo one-indexing: non-negative values were rendered as value + 1.
		const value = isOneIndexed && displayed > 0 ? displayed - 1 : displayed

		result.set(slot.unit.id, { value, formatShorthand: shorthand })
	})

	return result
}

/**
 * Matches the whole format first, then — when partial matching is allowed — every
 * contiguous run of fields, widest first, so the most specific reading wins.
 */
function matchSegments(
	segments: CompiledSegment[],
	formatted: string,
	allowPartial: boolean,
): { match: RegExpMatchArray; slots: Slot[] } | null {
	const attempt = (from: number, to: number) => {
		const span = segments.slice(from, to + 1)
		const match = formatted.match(new RegExp(`^${span.map((segment) => segment.source).join('')}$`, 'i'))
		return match ? { match, slots: span.flatMap((segment) => (segment.slot ? [segment.slot] : [])) } : null
	}

	const full = attempt(0, segments.length - 1)
	if (full || !allowPartial) {
		return full
	}

	const fields = segments.flatMap((segment, index) => (segment.slot ? [index] : []))
	for (let width = fields.length; width >= 2; width--) {
		for (let start = 0; start + width <= fields.length; start++) {
			const partial = attempt(fields[start], fields[start + width - 1])
			if (partial) {
				return partial
			}
		}
	}
	return null
}

function compile(segments: Segment[]): CompiledSegment[] {
	// A run of literals is one separator, however many format symbols wrote it.
	const merged = segments.reduce<Segment[]>((acc, segment) => {
		const previous = acc[acc.length - 1]
		if (!segment.slot && previous && !previous.slot) {
			previous.literal += segment.literal
			return acc
		}
		return [...acc, { ...segment }]
	}, [])

	return merged.map((segment, index) => {
		const { slot } = segment
		if (!slot) {
			return { source: literalPattern(segment.literal), slot: null }
		}

		const touchesField = !!merged[index - 1]?.slot || !!merged[index + 1]?.slot
		return { source: fieldPattern(slot, touchesField ? slot.symbolCount : 1), slot }
	})
}

function literalPattern(text: string): string {
	if (text.trim().length === 0) {
		return '\\s+'
	}

	const spaced = text.trim().split(/\s+/).map(escapeRegExp).join('\\s*')
	return `\\s*${spaced}\\s*`
}

function fieldPattern(slot: Slot, minDigits: number): string {
	const number = `-?\\d{${minDigits},}?`
	if (slot.unit.formatMode === 'Numeric' || slot.unit.formatMode === 'NumericOneIndexed') {
		return `(${number})`
	}

	const prefix = slot.symbolCount === 1 ? slot.unit.displayNameShort : slot.unit.displayName
	const numericForm = `${escapeRegExp(prefix ?? '')}\\s+${number}`
	if (!slot.labels || slot.labels.size === 0) {
		return `(${numericForm})`
	}

	const labelAlternation = [...slot.labels.keys()]
		.sort((a, b) => b.length - a.length)
		.map(escapeRegExp)
		.join('|')
	return `(${labelAlternation}|${numericForm})`
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Each label names the first instance of its relation, by ordinal of the child's bucket within the parent. */
function buildLabelTargets(allUnits: AnyUnit[]): Map<string, Map<string, LabelTarget>> {
	const model = getCalendarModel(allUnits)
	const byBucket = new Map<string, Map<string, LabelTarget>>()

	for (const parent of allUnits) {
		parent.children.forEach((relation, relationIndex) => {
			const child = model.unit(relation.childUnitId)
			if (!child || !isVisible(child) || !relation.label) {
				return
			}
			const bucket = unitBucket(child)
			const value = parent.children.slice(0, relationIndex).reduce((sum, earlier) => {
				const earlierChild = model.unit(earlier.childUnitId)
				return earlierChild ? sum + model.countOf(earlierChild, bucket) * earlier.repeats : sum
			}, 0)

			const labels = byBucket.get(bucket) ?? new Map<string, LabelTarget>()
			labels.set(relation.label.toLowerCase(), { unitId: child.id, value })
			byBucket.set(bucket, labels)
		})
	}

	return byBucket
}
