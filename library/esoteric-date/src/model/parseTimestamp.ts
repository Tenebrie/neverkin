import { ParsedTimestamp } from '../types.js'
import { AnyCalendarUnit, CalendarModel, isVisible, unitBucket } from './CalendarModel.js'
import { locate, precedingCount } from './Position.js'

/**
 * Every unit on the path to `time` under `root`, valued by its ordinal among instances of
 * its bucket inside the nearest visible ancestor (absolute if there is none).
 */
export function parseTimestampForRoot(
	model: CalendarModel,
	root: AnyCalendarUnit,
	time: number,
): ParsedTimestamp {
	const leaf = locate(model, root, time)
	const parsed: ParsedTimestamp = new Map()
	parsed.set(root.id, { unit: root, value: leaf.cycle, formatShorthand: root.formatShorthand ?? undefined })

	let scopeDepth = isVisible(root) ? 0 : null
	leaf.levels.forEach((level, depth) => {
		const slot = level.slots[level.index]
		const bucket = unitBucket(slot.unit)

		let value = scopeDepth === null ? leaf.cycle * model.countOf(root, bucket) : 0
		for (let inner = scopeDepth ?? 0; inner <= depth; inner++) {
			value += precedingCount(model, leaf.levels[inner], bucket)
		}

		parsed.set(slot.unit.id, {
			unit: slot.unit,
			value,
			formatShorthand: slot.unit.formatShorthand ?? undefined,
			customLabel: slot.label ?? undefined,
		})
		if (isVisible(slot.unit)) {
			scopeDepth = depth + 1
		}
	})
	return parsed
}

/** Roots in position order, each contributing the units whose format shorthand is still unclaimed. */
export function parseTimestamp(model: CalendarModel, time: number): ParsedTimestamp {
	const parsed: ParsedTimestamp = new Map()
	const claimedShorthands = new Set<string>()
	for (const root of model.roots) {
		for (const [unitId, entry] of parseTimestampForRoot(model, root, time)) {
			if (!entry.formatShorthand || claimedShorthands.has(entry.formatShorthand) || parsed.has(unitId)) {
				continue
			}
			parsed.set(unitId, entry)
			claimedShorthands.add(entry.formatShorthand)
		}
	}
	return parsed
}
