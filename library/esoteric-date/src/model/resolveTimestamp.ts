import { InputParsedTimestamp } from '../types.js'
import { AnyCalendarUnit, CalendarModel, isVisible, unitBucket } from './CalendarModel.js'
import { moveInstances, nthInstanceWithin } from './instances.js'
import { parentOf, Position, startOf, unitAt } from './Position.js'

/**
 * Inverse of parseTimestampForRoot: each value is an ordinal inside the last visible unit
 * resolved before it, or absolute when nothing visible precedes it.
 */
export function resolveTimestamp(model: CalendarModel, parsed: InputParsedTimestamp): number {
	const entries = [...parsed].flatMap(([unitId, entry]) => {
		const unit = model.unit(unitId)
		return unit ? [{ unit, value: entry.value }] : []
	})
	const root = model.roots.find((candidate) =>
		entries.some((entry) => occursUnder(model, candidate, entry.unit)),
	)
	if (!root) {
		return 0
	}

	const ordered = entries
		.filter((entry) => occursUnder(model, root, entry.unit))
		.sort((a, b) => Number(b.unit.duration) - Number(a.unit.duration))

	let scope: Position = { root, cycle: 0, levels: [] }
	let position = scope
	for (const { unit, value } of ordered) {
		const bucket = unitBucket(unit)
		let container = scope
		while (model.countOf(unitAt(container), bucket) === 0) {
			container = parentOf(container)
		}
		position = moveInstances(model, nthInstanceWithin(model, container, bucket, 1, 1), bucket, value)
		if (isVisible(unit)) {
			scope = position
		}
	}
	return startOf(position)
}

function occursUnder(model: CalendarModel, root: AnyCalendarUnit, unit: AnyCalendarUnit): boolean {
	return model.countOf(root, unitBucket(unit)) > 0
}
