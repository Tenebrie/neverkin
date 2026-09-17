import { CalendarDraftUnit, CalendarUnit } from '@/api/types/calendarTypes'

import { getCalendarModel } from '../model/CalendarModel.js'
import { resolveTimestamp } from '../model/resolveTimestamp.js'
import { InputParsedTimestamp } from '../types.js'

export function resolveParsedTimestamp({
	allUnits,
	parsedTimestamp,
}: {
	allUnits: CalendarUnit[] | CalendarDraftUnit[]
	parsedTimestamp: InputParsedTimestamp
}) {
	return resolveTimestamp(getCalendarModel(allUnits), parsedTimestamp)
}
