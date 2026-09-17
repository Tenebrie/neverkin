import { CalendarDraftUnit, CalendarUnit } from '@/api/types/calendarTypes'

import { getCalendarModel } from '../model/CalendarModel.js'
import { parseTimestamp } from '../model/parseTimestamp.js'

export function parseTimestampMultiRoot({
	allUnits,
	timestamp,
}: {
	allUnits: CalendarDraftUnit[] | CalendarUnit[]
	timestamp: number
}) {
	return parseTimestamp(getCalendarModel(allUnits), timestamp)
}
