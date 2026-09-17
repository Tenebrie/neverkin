import { CalendarModel, unitBucket } from './CalendarModel.js'
import { Position, unitAt } from './Position.js'

type Direction = 1 | -1

/**
 * The `ordinal`-th (1-based) instance of `bucket` inside the instance at `position`,
 * counted from its start (direction 1) or from its end (direction -1).
 */
export function nthInstanceWithin(
	model: CalendarModel,
	position: Position,
	bucket: string,
	ordinal: number,
	direction: Direction,
): Position {
	const levels = [...position.levels]
	let remaining = ordinal
	let unit = unitAt(position)

	while (unitBucket(unit) !== bucket) {
		const slots = model.slotsOf(unit)
		let index = direction > 0 ? 0 : slots.length - 1
		for (; index >= 0 && index < slots.length; index += direction) {
			const available = model.countOf(slots[index].unit, bucket)
			if (remaining <= available) {
				break
			}
			remaining -= available
		}
		if (index < 0 || index >= slots.length) {
			throw new Error(`Instance ${ordinal} of ${bucket} does not exist inside ${unit.name}`)
		}
		levels.push({ slots, index })
		unit = slots[index].unit
	}

	return { root: position.root, cycle: position.cycle, levels }
}

/** The instance of `bucket` that is `count` instances after (or before, if negative) `position`. */
export function moveInstances(
	model: CalendarModel,
	position: Position,
	bucket: string,
	count: number,
): Position {
	if (count === 0) {
		return position
	}
	const direction: Direction = count > 0 ? 1 : -1
	let remaining = Math.abs(count)
	const { root } = position
	const levels = [...position.levels]

	while (levels.length > 0) {
		const level = levels[levels.length - 1]
		for (let index = level.index + direction; index >= 0 && index < level.slots.length; index += direction) {
			const available = model.countOf(level.slots[index].unit, bucket)
			if (remaining > available) {
				remaining -= available
				continue
			}
			levels[levels.length - 1] = { slots: level.slots, index }
			return nthInstanceWithin(model, { root, cycle: position.cycle, levels }, bucket, remaining, direction)
		}
		levels.pop()
	}

	const perCycle = model.countOf(root, bucket)
	if (perCycle === 0) {
		throw new Error(`Unit ${bucket} never occurs under ${root.name}`)
	}
	const skippedCycles = Math.floor((remaining - 1) / perCycle)
	const cycle = position.cycle + direction * (1 + skippedCycles)
	remaining -= skippedCycles * perCycle
	return nthInstanceWithin(model, { root, cycle, levels: [] }, bucket, remaining, direction)
}

/** The latest instance of `bucket` starting at or before the located `leaf`. */
export function instanceAtOrBeforeLeaf(model: CalendarModel, bucket: string, leaf: Position): Position {
	if (unitBucket(leaf.root) === bucket) {
		return { ...leaf, levels: [] }
	}

	const insideDepth = leaf.levels.findIndex((level) => unitBucket(level.slots[level.index].unit) === bucket)
	if (insideDepth !== -1) {
		return { ...leaf, levels: leaf.levels.slice(0, insideDepth + 1) }
	}

	const outsideDepth = leaf.levels.findIndex(
		(level) => model.countOf(level.slots[level.index].unit, bucket) === 0,
	)
	if (outsideDepth === -1) {
		return nthInstanceWithin(model, leaf, bucket, 1, -1)
	}
	return moveInstances(model, { ...leaf, levels: leaf.levels.slice(0, outsideDepth + 1) }, bucket, -1)
}
