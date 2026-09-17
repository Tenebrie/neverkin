import { CalendarModel, unitBucket } from './CalendarModel.js'
import { instanceAtOrBeforeLeaf, moveInstances, nthInstanceWithin } from './instances.js'
import { locate, Position, precedingCount, startOf, unitAt } from './Position.js'

interface TailLevel {
	bucket: string
	ordinal: number
}

export function floorTimestamp(model: CalendarModel, bucket: string, time: number): number {
	const root = requireRoot(model, bucket)
	return startOf(instanceAtOrBeforeLeaf(model, bucket, locate(model, root, time)))
}

/**
 * Move `count` instances of `bucket` from the one containing `time`, keeping the position
 * inside it (day of month, hour of day) as far as the destination instance allows.
 */
export function stepTimestamp(model: CalendarModel, bucket: string, time: number, count: number): number {
	const root = requireRoot(model, bucket)
	const leaf = locate(model, root, time)
	const current = instanceAtOrBeforeLeaf(model, bucket, leaf)
	const tail = tailBelow(model, leaf, current)
	const destination = moveInstances(model, current, bucket, count)
	return startOf(applyTail(model, destination, tail))
}

function requireRoot(model: CalendarModel, bucket: string) {
	const root = model.rootOf(bucket)
	if (!root) {
		throw new Error(`No bucket match for unit ${bucket}`)
	}
	return root
}

/** The ordinals of every level of `leaf` below `instance`, when `leaf` lies inside it. */
function tailBelow(model: CalendarModel, leaf: Position, instance: Position): TailLevel[] {
	const isInside =
		leaf.cycle === instance.cycle &&
		instance.levels.every((level, depth) => leaf.levels[depth]?.index === level.index)
	if (!isInside) {
		return []
	}
	return leaf.levels.slice(instance.levels.length).map((level) => {
		const bucket = unitBucket(level.slots[level.index].unit)
		return { bucket, ordinal: precedingCount(model, level, bucket) }
	})
}

function applyTail(model: CalendarModel, instance: Position, tail: TailLevel[]): Position {
	let position = instance
	for (const { bucket, ordinal } of tail) {
		const available = model.countOf(unitAt(position), bucket)
		if (available === 0) {
			break
		}
		position = nthInstanceWithin(model, position, bucket, Math.min(ordinal + 1, available), 1)
	}
	return position
}
