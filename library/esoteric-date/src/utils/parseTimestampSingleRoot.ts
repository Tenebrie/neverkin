import { CalendarDraftUnit, CalendarUnit } from '@/api/types/calendarTypes'

import { getCalendarModel } from '../model/CalendarModel.js'
import { parseTimestampForRoot } from '../model/parseTimestamp.js'

export function parseTimestampSingleRoot({
	allUnits,
	unit,
	timestamp,
}: {
	allUnits: CalendarDraftUnit[] | CalendarUnit[]
	unit: CalendarDraftUnit | CalendarUnit
	timestamp: number
}) {
	return parseTimestampForRoot(getCalendarModel(allUnits), unit, timestamp)
}
