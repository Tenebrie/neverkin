import { CalendarDraftUnit, CalendarUnit } from '@/api/types/calendarTypes'

export type AnyCalendarUnit = CalendarUnit | CalendarDraftUnit

/** One child occurrence inside a parent instance, with repeats already expanded. */
export interface Slot {
	unit: AnyCalendarUnit
	offset: number
	duration: number
	label: string | null
}

/** Units that present as the same kind of thing (regular and leap year, every month length). */
export function unitBucket(unit: Pick<AnyCalendarUnit, 'name' | 'displayName'>): string {
	return (unit.displayName ?? unit.name).toLowerCase()
}

export function isVisible(unit: AnyCalendarUnit): boolean {
	return unit.formatMode !== 'Hidden'
}

export class CalendarModel {
	readonly roots: AnyCalendarUnit[]
	private readonly unitById: Map<string, AnyCalendarUnit>
	private readonly slotsByUnitId = new Map<string, Slot[]>()
	private readonly instanceCounts = new Map<string, number>()

	constructor(units: AnyCalendarUnit[]) {
		this.unitById = new Map(units.map((unit) => [unit.id, unit]))
		this.roots = units
			.filter((unit) => unit.parents.every((relation) => !this.unitById.has(relation.parentUnitId)))
			.sort((a, b) => a.position - b.position)
	}

	unit(id: string): AnyCalendarUnit | undefined {
		return this.unitById.get(id)
	}

	slotsOf(unit: AnyCalendarUnit): Slot[] {
		const cached = this.slotsByUnitId.get(unit.id)
		if (cached) {
			return cached
		}
		const slots = this.buildSlots(unit)
		this.slotsByUnitId.set(unit.id, slots)
		return slots
	}

	/** Instances of `bucket` inside one instance of `unit`; a unit of that bucket counts as one. */
	countOf(unit: AnyCalendarUnit, bucket: string): number {
		if (unitBucket(unit) === bucket) {
			return 1
		}
		const key = `${unit.id}\0${bucket}`
		const cached = this.instanceCounts.get(key)
		if (cached !== undefined) {
			return cached
		}
		const count = this.slotsOf(unit).reduce((sum, slot) => sum + this.countOf(slot.unit, bucket), 0)
		this.instanceCounts.set(key, count)
		return count
	}

	/** The first root (by position) under which the bucket occurs. */
	rootOf(bucket: string): AnyCalendarUnit | undefined {
		return this.roots.find((root) => this.countOf(root, bucket) > 0)
	}

	private buildSlots(unit: AnyCalendarUnit): Slot[] {
		const slots: Slot[] = []
		let offset = 0
		for (const relation of unit.children) {
			const child = this.unitById.get(relation.childUnitId)
			if (!child) {
				continue
			}
			const duration = Number(child.duration)
			for (let repeat = 0; repeat < relation.repeats; repeat++) {
				slots.push({ unit: child, offset, duration, label: relation.label ?? null })
				offset += duration
			}
		}
		return slots
	}
}

const modelsByUnits = new WeakMap<AnyCalendarUnit[], CalendarModel>()

export function getCalendarModel(units: AnyCalendarUnit[]): CalendarModel {
	const cached = modelsByUnits.get(units)
	if (cached) {
		return cached
	}
	const model = new CalendarModel(units)
	modelsByUnits.set(units, model)
	return model
}
