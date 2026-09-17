import { CalendarUnit } from '@/api/types/calendarTypes'
import { WorldCalendar, WorldCalendarUnit } from '@/api/types/worldTypes'

import { CalendarModel, getCalendarModel, unitBucket } from './model/CalendarModel.js'
import { parseTimestamp } from './model/parseTimestamp.js'
import { resolveTimestamp } from './model/resolveTimestamp.js'
import { floorTimestamp, stepTimestamp } from './model/stepTimestamp.js'
import { ParsedTimestamp, ParsedTimestampEntry } from './types.js'
import { formatTimestampUnits } from './utils/formatTimestampUnits.js'
import { parseFormattedTimestamp } from './utils/parseFormattedTimestamp.js'

export class EsotericDate {
	private readonly calendar: WorldCalendar
	private readonly timestamp: number
	private readonly model: CalendarModel
	private parsed: ParsedTimestamp | null = null

	constructor(calendar: WorldCalendar, timestamp?: number)
	constructor(date: EsotericDate)
	constructor(calendarOrDate: WorldCalendar | EsotericDate, timestamp?: number) {
		if (calendarOrDate instanceof EsotericDate) {
			this.calendar = calendarOrDate.calendar
			this.timestamp = calendarOrDate.timestamp
			this.model = calendarOrDate.model
			this.parsed = calendarOrDate.parsed
		} else {
			this.calendar = calendarOrDate
			this.timestamp = Number(timestamp ?? 0)
			this.model = getCalendarModel(calendarOrDate.units)
		}
	}

	getTimestamp(): number {
		return this.timestamp
	}

	fromFormatted(formatted: string): EsotericDate {
		const dateFormat = this.calendar.dateFormat
		if (!dateFormat || dateFormat.trim().length === 0) {
			throw new Error('No date format specified')
		}
		const parsed = parseFormattedTimestamp({ allUnits: this.calendar.units, formatted, dateFormat })
		return this.atAbsoluteTime(resolveTimestamp(this.model, parsed))
	}

	format(formatString?: string): string {
		return formatTimestampUnits(
			this.calendar.units,
			this.parse(),
			formatString ?? this.calendar.dateFormat ?? '',
		)
	}

	getBucketId(unit: CalendarUnit): string | undefined {
		return this.entryFor(unit)?.unit.id
	}

	get(unit: WorldCalendarUnit): ParsedTimestampEntry | undefined {
		return this.entryFor(unit)
	}

	/** Duration of the current instance of the unit's kind, e.g. this month's length. */
	getDuration(unit: CalendarUnit): number {
		return Number(this.entryFor(unit)?.unit.duration ?? 0)
	}

	/** Move by `amount` instances of the unit's kind, keeping the position inside it where possible. */
	step(unit: WorldCalendarUnit, amount: number = 1): EsotericDate {
		return this.atAbsoluteTime(stepTimestamp(this.model, unitBucket(unit), this.absoluteTime, amount))
	}

	/** The start of the latest instance of the unit's kind at or before this date. */
	floor(unit: WorldCalendarUnit): EsotericDate {
		return this.atAbsoluteTime(floorTimestamp(this.model, unitBucket(unit), this.absoluteTime))
	}

	/** The closer of floor and the instance after it; ties go down. */
	round(unit: WorldCalendarUnit): EsotericDate {
		const floored = this.floor(unit)
		const ceiled = floored.step(unit, 1)
		return ceiled.timestamp - this.timestamp < this.timestamp - floored.timestamp ? ceiled : floored
	}

	private get absoluteTime(): number {
		return this.timestamp + Number(this.calendar.originTime)
	}

	private atAbsoluteTime(absoluteTime: number): EsotericDate {
		return new EsotericDate(this.calendar, absoluteTime - Number(this.calendar.originTime))
	}

	private parse(): ParsedTimestamp {
		return (this.parsed ??= parseTimestamp(this.model, this.absoluteTime))
	}

	private entryFor(unit: Pick<CalendarUnit, 'name' | 'displayName'>): ParsedTimestampEntry | undefined {
		const bucket = unitBucket(unit)
		return [...this.parse().values()].find((entry) => unitBucket(entry.unit) === bucket)
	}
}
