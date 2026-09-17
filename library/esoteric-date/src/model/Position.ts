import { AnyCalendarUnit, CalendarModel, Slot } from './CalendarModel.js'

export interface Level {
	slots: Slot[]
	index: number
}

/** A unit instance: which cycle of the root, then the slot taken at each depth below it. */
export interface Position {
	root: AnyCalendarUnit
	cycle: number
	levels: Level[]
}

export function unitAt(position: Position): AnyCalendarUnit {
	const level = position.levels[position.levels.length - 1]
	return level ? level.slots[level.index].unit : position.root
}

export function startOf(position: Position): number {
	const cycleStart = position.cycle * Number(position.root.duration)
	return position.levels.reduce((time, level) => time + level.slots[level.index].offset, cycleStart)
}

export function parentOf(position: Position): Position {
	return { ...position, levels: position.levels.slice(0, -1) }
}

/** The deepest instance under `root` that contains `time`. */
export function locate(model: CalendarModel, root: AnyCalendarUnit, time: number): Position {
	const rootDuration = Number(root.duration)
	const cycle = Math.floor(time / rootDuration)
	let remainder = time - cycle * rootDuration
	const levels: Level[] = []

	let unit = root
	while (true) {
		const slots = model.slotsOf(unit)
		const index = slots.findIndex((slot) => remainder < slot.offset + slot.duration)
		if (index === -1) {
			return { root, cycle, levels }
		}
		levels.push({ slots, index })
		unit = slots[index].unit
		remainder -= slots[index].offset
	}
}

/** Instances of `bucket` that start before the level's slot, inside the same parent instance. */
export function precedingCount(model: CalendarModel, level: Level, bucket: string): number {
	let count = 0
	for (let index = 0; index < level.index; index++) {
		count += model.countOf(level.slots[index].unit, bucket)
	}
	return count
}
