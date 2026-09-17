import { describe, expect, it } from 'vitest'

import {
	EARTH,
	mockCalendar,
	mockCalendarUnit,
	mockCalendarUnitChildRelation,
	mockCalendarUnitParentRelation,
	mockEarthCalendar,
} from '@/api/mock/rheaModels.mock'
import { CalendarUnit } from '@/api/types/calendarTypes'
import { WorldCalendar } from '@/api/types/worldTypes'

import { EsotericDate } from './EsotericDate'

function makeCalendar(units: CalendarUnit[]): WorldCalendar {
	return mockCalendar({ units })
}

describe('nested hidden parents (Earth-like: BigCycle → YearCycle, with mixed children)', () => {
	// YearCycle (Hidden) → [NormalYear x2, LeapYear x1], duration = 2*365 + 366 = 1096
	// BigCycle (Hidden) → [YearCycle x2, NormalYear x1], duration = 2*1096 + 365 = 2557
	// When stepping the YearCycle backward from the start of a BigCycle,
	// it must land on the previous YearCycle, not on the trailing NormalYear.
	const day = mockCalendarUnit({
		id: 'day',
		name: 'Day',
		duration: 1,
		formatShorthand: 'd',
		parents: [
			mockCalendarUnitParentRelation('normal-year', 'day', 365),
			mockCalendarUnitParentRelation('leap-year', 'day', 366),
		],
	})
	const normalYear = mockCalendarUnit({
		id: 'normal-year',
		name: 'NormalYear',
		displayName: 'Year',
		duration: 365,
		formatShorthand: 'Y',
		children: [mockCalendarUnitChildRelation('normal-year', 'day', 365)],
		parents: [
			mockCalendarUnitParentRelation('year-cycle', 'normal-year', 2),
			mockCalendarUnitParentRelation('big-cycle', 'normal-year', 1),
		],
	})
	const leapYear = mockCalendarUnit({
		id: 'leap-year',
		name: 'LeapYear',
		displayName: 'Year',
		duration: 366,
		formatShorthand: 'Y',
		children: [mockCalendarUnitChildRelation('leap-year', 'day', 366)],
		parents: [mockCalendarUnitParentRelation('year-cycle', 'leap-year', 1)],
	})
	const yearCycle = mockCalendarUnit({
		id: 'year-cycle',
		name: 'YearCycle',
		duration: 1096,
		formatMode: 'Hidden',
		children: [
			mockCalendarUnitChildRelation('year-cycle', 'normal-year', 2, { position: 0 }),
			mockCalendarUnitChildRelation('year-cycle', 'leap-year', 1, { position: 1 }),
		],
		parents: [mockCalendarUnitParentRelation('big-cycle', 'year-cycle', 2)],
	})
	const bigCycle = mockCalendarUnit({
		id: 'big-cycle',
		name: 'BigCycle',
		duration: 2557,
		formatMode: 'Hidden',
		children: [
			mockCalendarUnitChildRelation('big-cycle', 'year-cycle', 2, { position: 0 }),
			mockCalendarUnitChildRelation('big-cycle', 'normal-year', 1, { position: 1 }),
		],
	})
	const units: CalendarUnit[] = [bigCycle, yearCycle, normalYear, leapYear, day]
	const calendar = makeCalendar(units)

	it('stepping year -4 from start of BigCycle lands in previous BigCycle', () => {
		// At start of BigCycle 1 = timestamp 2557, NormalYear 0 day 0 in YearCycle 0
		// BigCycle 0 years in order:
		//   Year 0: Normal (0), Year 1: Normal (365), Year 2: Leap (730) [YC0]
		//   Year 3: Normal (1096), Year 4: Normal (1461), Year 5: Leap (1826) [YC1]
		//   Year 6: Normal (2192) [trailing]
		// step(Year, -4) from year 7 → year 3 = Normal at 1096
		const date = new EsotericDate(calendar, 2557)
		const result = date.step(normalYear, -4)
		expect(result.getTimestamp()).toBe(1096)
	})

	it('stepping year +1 from start of BigCycle stays in correct slot', () => {
		// At BigCycle boundary, step forward 1 year
		const date = new EsotericDate(calendar, 2557)
		const result = date.step(normalYear, 1)
		// Should go to NormalYear 1 in YearCycle 0 of BigCycle 1 = 2557 + 365 = 2922
		expect(result.getTimestamp()).toBe(2922)
	})

	it('stepping year -1 from start of BigCycle wraps to previous yearCycle last slot', () => {
		// At start of BigCycle 1 (ts=2557), NormalYear 0 in YearCycle 0.
		// step -1: goes to the last year in BigCycle 0.
		// BigCycle 0's last year is the trailing NormalYear at 2192.
		const date = new EsotericDate(calendar, 2557)
		const result = date.step(normalYear, -1)
		expect(result.getTimestamp()).toBe(2192)
	})
})

describe('Earth-like full calendar (400-year cycle boundary stepping)', () => {
	// Exact Earth calendar structure:
	// Regular year = 365 days (duration: 365)
	// Leap year = 366 days (duration: 366)
	// 4-year cycle = Regular x3 + Leap x1 = 1461
	// 100-year cycle = 4-year-cycle x24 + Regular x4 = 24*1461 + 4*365 = 35064 + 1460 = 36524
	// 400-year cycle = 100-year-cycle x3 + 4-year-cycle x25 = 3*36524 + 25*1461 = 109572 + 36525 = 146097
	// Using days as base unit (duration=1) for simplicity
	const day = mockCalendarUnit({
		id: 'day',
		name: 'Day',
		duration: 1,
		formatShorthand: 'd',
		formatMode: 'NumericOneIndexed',
		displayName: 'Day',
		parents: [
			mockCalendarUnitParentRelation('regular-year', 'day', 365),
			mockCalendarUnitParentRelation('leap-year', 'day', 366),
		],
	})
	const regularYear = mockCalendarUnit({
		id: 'regular-year',
		name: 'Regular year',
		displayName: 'Year',
		duration: 365,
		formatShorthand: 'Y',
		formatMode: 'NumericOneIndexed',
		children: [mockCalendarUnitChildRelation('regular-year', 'day', 365)],
		parents: [
			mockCalendarUnitParentRelation('4-year-cycle', 'regular-year', 3),
			mockCalendarUnitParentRelation('100-year-cycle', 'regular-year', 4),
		],
	})
	const leapYear = mockCalendarUnit({
		id: 'leap-year',
		name: 'Leap year',
		displayName: 'Year',
		duration: 366,
		formatShorthand: 'Y',
		formatMode: 'NumericOneIndexed',
		children: [mockCalendarUnitChildRelation('leap-year', 'day', 366)],
		parents: [mockCalendarUnitParentRelation('4-year-cycle', 'leap-year', 1)],
	})
	const fourYearCycle = mockCalendarUnit({
		id: '4-year-cycle',
		name: '4-year cycle',
		duration: 1461, // 3*365 + 366
		formatMode: 'Hidden',
		children: [
			mockCalendarUnitChildRelation('4-year-cycle', 'regular-year', 3, { position: 0 }),
			mockCalendarUnitChildRelation('4-year-cycle', 'leap-year', 1, { position: 1 }),
		],
		parents: [
			mockCalendarUnitParentRelation('100-year-cycle', '4-year-cycle', 24),
			mockCalendarUnitParentRelation('400-year-cycle', '4-year-cycle', 25),
		],
	})
	const hundredYearCycle = mockCalendarUnit({
		id: '100-year-cycle',
		name: '100-year cycle',
		duration: 36524, // 24*1461 + 4*365
		formatMode: 'Hidden',
		children: [
			mockCalendarUnitChildRelation('100-year-cycle', '4-year-cycle', 24, { position: 0 }),
			mockCalendarUnitChildRelation('100-year-cycle', 'regular-year', 4, { position: 1 }),
		],
		parents: [mockCalendarUnitParentRelation('400-year-cycle', '100-year-cycle', 3)],
	})
	const fourHundredYearCycle = mockCalendarUnit({
		id: '400-year-cycle',
		name: '400-year cycle',
		duration: 146097, // 3*36524 + 25*1461
		formatMode: 'Hidden',
		children: [
			mockCalendarUnitChildRelation('400-year-cycle', '100-year-cycle', 3, { position: 0 }),
			mockCalendarUnitChildRelation('400-year-cycle', '4-year-cycle', 25, { position: 1 }),
		],
	})
	const units = [fourHundredYearCycle, hundredYearCycle, fourYearCycle, regularYear, leapYear, day]
	const calendar = makeCalendar(units)

	// 400-year cycle starts at timestamp 0.
	// Year 0 starts at 0.
	// The 5th 400-year cycle starts at 5 * 146097 = 730485
	// For testing, let's focus on the boundary of the 1st 400-year cycle (ts=146097)

	it('step(Year, 4) produces monotonically increasing timestamps across 400-year boundary', () => {
		// Start a few 4-year-cycles before the boundary
		// 400-year boundary at 146097
		// 8 years before = 2 four-year-cycles = 2 * 1461 = 2922 before
		const startTs = 146097 - 2922
		let date = new EsotericDate(calendar, startTs)
		const timestamps: number[] = [date.getTimestamp()]

		// Step forward by 4 years at a time, collecting timestamps
		for (let i = 0; i < 10; i++) {
			date = date.step(regularYear, 4)
			timestamps.push(date.getTimestamp())
		}

		// All timestamps should be monotonically increasing
		for (let i = 1; i < timestamps.length; i++) {
			expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1])
		}
	})

	it('step(Year, 1) produces monotonically increasing timestamps across 400-year boundary', () => {
		// Start 4 years before the 400-year boundary
		const startTs = 146097 - 1461
		let date = new EsotericDate(calendar, startTs)
		const timestamps: number[] = [date.getTimestamp()]

		for (let i = 0; i < 12; i++) {
			date = date.step(regularYear, 1)
			timestamps.push(date.getTimestamp())
		}

		for (let i = 1; i < timestamps.length; i++) {
			expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1])
		}
	})

	it('floor(Year) at 400-year boundary returns correct timestamp', () => {
		// Just after the 400-year boundary
		const date = new EsotericDate(calendar, 146097 + 10)
		const floored = date.floor(regularYear)
		expect(floored.getTimestamp()).toBe(146097)
	})

	it('get(Year).value at and around 400-year boundary', () => {
		// Year at timestamp 0 should have value 0
		const year0 = new EsotericDate(calendar, 0)
		const val0 = year0.get(regularYear)!.value

		// Year at 400-year boundary
		const yearAtBoundary = new EsotericDate(calendar, 146097)
		const valBoundary = yearAtBoundary.get(regularYear)!.value

		// These should differ by 400
		expect(valBoundary - val0).toBe(400)
	})

	it('baseDate alignment (value % 4) works at 400-year boundary', () => {
		// This simulates what regenerateDividers does
		const ts = 146097 // exact 400-year boundary
		const date = new EsotericDate(calendar, ts)
		const floored = date.floor(regularYear)
		const value = floored.get(regularYear)!.value
		const subdivision = 4
		const valueToStep = value % subdivision

		// Step back to aligned position
		const aligned = floored.step(regularYear, -valueToStep - subdivision)

		// Now step forward by 4 repeatedly and check we get correct timestamps
		let current = aligned
		const timestamps: number[] = []
		for (let i = 0; i < 10; i++) {
			current = current.step(regularYear, subdivision)
			timestamps.push(current.getTimestamp())
		}

		// All timestamps should be monotonically increasing
		for (let i = 1; i < timestamps.length; i++) {
			expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1])
		}

		// The boundary timestamp (146097) should be among the collected timestamps
		// since year 400 should be a multiple of 4
		expect(timestamps).toContain(146097)
	})

	it('step(Year, 4) around 100-year-cycle boundary within 400-year-cycle', () => {
		// 100-year cycle boundary at 36524
		const startTs = 36524 - 2922 // 8 years before
		let date = new EsotericDate(calendar, startTs)
		const timestamps: number[] = [date.getTimestamp()]

		for (let i = 0; i < 10; i++) {
			date = date.step(regularYear, 4)
			timestamps.push(date.getTimestamp())
		}

		for (let i = 1; i < timestamps.length; i++) {
			expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1])
		}
	})

	it('step(Year, 4) with real second-based durations across 400-year boundary', () => {
		// Same structure but with realistic second-based durations
		const dayS = mockCalendarUnit({
			id: 'day-s',
			name: 'Day',
			duration: 86400,
			formatShorthand: 'd',
			formatMode: 'NumericOneIndexed',
			displayName: 'Day',
			parents: [
				mockCalendarUnitParentRelation('regular-year-s', 'day-s', 365),
				mockCalendarUnitParentRelation('leap-year-s', 'day-s', 366),
			],
		})
		const regularYearS = mockCalendarUnit({
			id: 'regular-year-s',
			name: 'Regular year',
			displayName: 'Year',
			duration: 365 * 86400,
			formatShorthand: 'Y',
			formatMode: 'NumericOneIndexed',
			children: [mockCalendarUnitChildRelation('regular-year-s', 'day-s', 365)],
			parents: [
				mockCalendarUnitParentRelation('4-year-cycle-s', 'regular-year-s', 3),
				mockCalendarUnitParentRelation('100-year-cycle-s', 'regular-year-s', 4),
			],
		})
		const leapYearS = mockCalendarUnit({
			id: 'leap-year-s',
			name: 'Leap year',
			displayName: 'Year',
			duration: 366 * 86400,
			formatShorthand: 'Y',
			formatMode: 'NumericOneIndexed',
			children: [mockCalendarUnitChildRelation('leap-year-s', 'day-s', 366)],
			parents: [mockCalendarUnitParentRelation('4-year-cycle-s', 'leap-year-s', 1)],
		})
		const fourYearCycleS = mockCalendarUnit({
			id: '4-year-cycle-s',
			name: '4-year cycle',
			duration: (3 * 365 + 366) * 86400,
			formatMode: 'Hidden',
			children: [
				mockCalendarUnitChildRelation('4-year-cycle-s', 'regular-year-s', 3, { position: 0 }),
				mockCalendarUnitChildRelation('4-year-cycle-s', 'leap-year-s', 1, { position: 1 }),
			],
			parents: [
				mockCalendarUnitParentRelation('100-year-cycle-s', '4-year-cycle-s', 24),
				mockCalendarUnitParentRelation('400-year-cycle-s', '4-year-cycle-s', 25),
			],
		})
		const hundredYearCycleS = mockCalendarUnit({
			id: '100-year-cycle-s',
			name: '100-year cycle',
			duration: (24 * 1461 + 4 * 365) * 86400,
			formatMode: 'Hidden',
			children: [
				mockCalendarUnitChildRelation('100-year-cycle-s', '4-year-cycle-s', 24, { position: 0 }),
				mockCalendarUnitChildRelation('100-year-cycle-s', 'regular-year-s', 4, { position: 1 }),
			],
			parents: [mockCalendarUnitParentRelation('400-year-cycle-s', '100-year-cycle-s', 3)],
		})
		const fourHundredYearCycleS = mockCalendarUnit({
			id: '400-year-cycle-s',
			name: '400-year cycle',
			duration: 146097 * 86400,
			formatMode: 'Hidden',
			children: [
				mockCalendarUnitChildRelation('400-year-cycle-s', '100-year-cycle-s', 3, { position: 0 }),
				mockCalendarUnitChildRelation('400-year-cycle-s', '4-year-cycle-s', 25, { position: 1 }),
			],
		})
		const unitsS = [fourHundredYearCycleS, hundredYearCycleS, fourYearCycleS, regularYearS, leapYearS, dayS]
		const calendarS = makeCalendar(unitsS)

		// 400-year boundary in seconds
		const boundary = 146097 * 86400
		const startTs = boundary - 2922 * 86400 // 8 years before
		let date = new EsotericDate(calendarS, startTs)
		const timestamps: number[] = [date.getTimestamp()]

		for (let i = 0; i < 10; i++) {
			date = date.step(regularYearS, 4)
			timestamps.push(date.getTimestamp())
		}

		for (let i = 1; i < timestamps.length; i++) {
			expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1])
		}
	})

	it('step(Year, 4) with originTime across 400-year boundary', () => {
		// Same calendar but with an originTime offset (simulating real Earth calendar)
		const originTime = 1063468800 // Earth 2023 origin
		const calendarWithOrigin = makeCalendar(units)
		calendarWithOrigin.originTime = originTime

		// The 400-year cycle boundary nearest to year 2000 at originTime...
		// With originTime, the cycle alignment shifts.
		// Let's find a 400-year boundary: it's at multiples of 146097 in absolute space.
		// absolute timestamp = rawTimestamp + originTime
		// So 400-year boundary is when (rawTimestamp + originTime) % 146097 == 0
		// rawTimestamp = k * 146097 - originTime
		// Find k such that rawTimestamp is near 0:
		// k = ceil(originTime / 146097) = ceil(1063468800 / 146097) = ceil(7278.something) = 7279
		// rawTimestamp = 7279 * 146097 - 1063468800
		const k = Math.ceil(originTime / 146097)
		const boundaryRaw = k * 146097 - originTime

		const startTs = boundaryRaw - 2922 // 8 years before boundary
		let date = new EsotericDate(calendarWithOrigin, startTs)
		const timestamps: number[] = [date.getTimestamp()]

		for (let i = 0; i < 10; i++) {
			date = date.step(regularYear, 4)
			timestamps.push(date.getTimestamp())
		}

		for (let i = 1; i < timestamps.length; i++) {
			expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1])
		}
	})

	it('baseDate alignment with originTime at 400-year boundary', () => {
		// Test the full regenerateDividers logic with originTime
		const originTime = 1063468800
		const calendarWithOrigin = makeCalendar(units)
		calendarWithOrigin.originTime = originTime

		const k = Math.ceil(originTime / 146097)
		const boundaryRaw = k * 146097 - originTime

		// Simulate being right at the boundary
		const ts = boundaryRaw + 50
		const date = new EsotericDate(calendarWithOrigin, ts)
		const floored = date.floor(regularYear)
		const value = floored.get(regularYear)!.value
		const subdivision = 4
		const valueToStep = value % subdivision

		// Step back to aligned position
		const aligned = floored.step(regularYear, -valueToStep - subdivision)

		// Step forward and ensure monotonic
		let current = aligned
		const timestamps: number[] = []
		for (let i = 0; i < 15; i++) {
			current = current.step(regularYear, subdivision)
			timestamps.push(current.getTimestamp())
		}

		for (let i = 1; i < timestamps.length; i++) {
			expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1])
		}
	})

	it('step(Year, 1) across 100-year-cycle boundary - every step increments', () => {
		// 100-year-cycle = 36524 days
		// = 24 * 1461 (4-year-cycles) + 4 * 365 (tail regular years)
		// = 35064 + 1460 = 36524
		// Year 94 in the 100-year-cycle is the 3rd year in the last (24th) 4-year-cycle
		// Year 95 is the Leap year at end of last 4-year-cycle
		// Year 96 is first of the 4 trailing regular years
		// Year 97 is second, etc.
		// Year 100 = start of next 100-year-cycle

		// Start at year 93 (in the 24th 4-year-cycle, which starts at 23*1461 = 33603)
		// 23rd 4-year-cycle starts at 33603, contains 3 regular + 1 leap
		// Year 92 = Regular year 0 of 24th 4yc = 33603
		// Year 93 = Regular year 1 of 24th 4yc = 33603 + 365 = 33968
		// Year 94 = Regular year 2 of 24th 4yc = 33968 + 365 = 34333
		// Year 95 = Leap year of 24th 4yc = 34333 + 365 = 34698, ends at 34698 + 366 = 35064
		// Year 96 = First tail Regular year = 35064
		// Year 97 = 35064 + 365 = 35429
		// Year 98 = 35429 + 365 = 35794
		// Year 99 = 35794 + 365 = 36159
		// Year 100 = 36524 (start of next 100-year-cycle)

		const startTs = 33968 // Year 93
		let date = new EsotericDate(calendar, startTs)

		const results: { ts: number; value: number }[] = []
		for (let i = 0; i < 10; i++) {
			const ts = date.getTimestamp()
			const value = date.get(regularYear)!.value
			results.push({ ts, value })
			date = date.step(regularYear, 1)
		}

		// Every timestamp must increase
		for (let i = 1; i < results.length; i++) {
			expect(results[i].ts).toBeGreaterThan(results[i - 1].ts)
		}

		// Check specific timestamps around the boundary
		// Year 93 starts at 33968
		expect(results[0].ts).toBe(33968)
		// Year 94 starts at 34333
		expect(results[1].ts).toBe(34333)
		// Year 95 (Leap) starts at 34698
		expect(results[2].ts).toBe(34698)
		// Year 96 (first tail Regular) starts at 35064
		expect(results[3].ts).toBe(35064)
		// Year 97 starts at 35429
		expect(results[4].ts).toBe(35429)
	})

	it('step(Year, 4) across 100-year-cycle boundary produces correct spacing', () => {
		// Start at a position aligned to 4-year boundary before the 100-year boundary
		// 100-year cycle boundary at 36524
		// Start 12 years before
		const startTs = 36524 - 12 * 365 - 3 * 1 // approximate, minus ~3 leap days
		let date = new EsotericDate(calendar, startTs).floor(regularYear)

		const results: { ts: number; value: number }[] = []
		for (let i = 0; i < 8; i++) {
			const ts = date.getTimestamp()
			const value = date.get(regularYear)!.value
			results.push({ ts, value })
			date = date.step(regularYear, 4)
		}

		// Every timestamp must increase
		for (let i = 1; i < results.length; i++) {
			expect(results[i].ts).toBeGreaterThan(results[i - 1].ts)
		}

		// Each gap should be approximately 4 years (1460-1462 days for mixed regular/leap)
		for (let i = 1; i < results.length; i++) {
			const gap = results[i].ts - results[i - 1].ts
			expect(gap).toBeGreaterThanOrEqual(4 * 365)
			expect(gap).toBeLessThanOrEqual(4 * 366)
		}
	})

	it('floor() at 100-year boundary tail Regular years', () => {
		// At the 100-year boundary, the last 4 years are Regular years (not in any 4-year-cycle)
		// 100-year cycle = 36524 days, so years 96-99 are the tail
		// Let's find year 97 (the 2nd of the 4 trailing regular years)
		// 24 4-year-cycles = 24 * 1461 = 35064 days
		// Then Regular year 0 starts at 35064, year 1 at 35064+365=35429, year 2 at 35794, year 3 at 36159
		const tailYear2Start = 35064 + 2 * 365 // year 98 in 0-indexed, "year 99" in 1-indexed
		const date = new EsotericDate(calendar, tailYear2Start + 50) // mid-year
		const floored = date.floor(regularYear)
		expect(floored.getTimestamp()).toBe(tailYear2Start)
	})

	it('get(Year).value is correct for tail Regular years at 100-year boundary', () => {
		// First tail regular year starts at day 35064
		const tailYear0 = new EsotericDate(calendar, 35064)
		const val0 = tailYear0.get(regularYear)!.value

		// Second tail regular year
		const tailYear1 = new EsotericDate(calendar, 35064 + 365)
		const val1 = tailYear1.get(regularYear)!.value
		expect(val1).toBe(val0 + 1)

		// Third tail regular year
		const tailYear2 = new EsotericDate(calendar, 35064 + 2 * 365)
		const val2 = tailYear2.get(regularYear)!.value
		expect(val2).toBe(val0 + 2)

		// Fourth tail regular year
		const tailYear3 = new EsotericDate(calendar, 35064 + 3 * 365)
		const val3 = tailYear3.get(regularYear)!.value
		expect(val3).toBe(val0 + 3)

		// Year after 100-year cycle
		const nextCycleYear = new EsotericDate(calendar, 36524)
		const valNext = nextCycleYear.get(regularYear)!.value
		expect(valNext).toBe(val0 + 4)
	})

	it('step(Year, -1) produces monotonically decreasing timestamps across 100-year boundary', () => {
		// Start a few years after the 100-year boundary (36524) and step backward
		const startTs = 36524 + 4 * 365 // ~4 years after 100-year boundary
		let date = new EsotericDate(calendar, startTs).floor(regularYear)
		const timestamps: number[] = [date.getTimestamp()]

		for (let i = 0; i < 12; i++) {
			date = date.step(regularYear, -1)
			timestamps.push(date.getTimestamp())
		}

		// All timestamps should be monotonically decreasing
		for (let i = 1; i < timestamps.length; i++) {
			expect(
				timestamps[i],
				`Step ${i}: ts=${timestamps[i]} should be less than prev ts=${timestamps[i - 1]}, diff=${timestamps[i] - timestamps[i - 1]}`,
			).toBeLessThan(timestamps[i - 1])
		}

		// Each gap should be a single year (365 or 366 days)
		for (let i = 1; i < timestamps.length; i++) {
			const gap = timestamps[i - 1] - timestamps[i]
			expect(
				gap,
				`Gap at step ${i}: expected 365 or 366, got ${gap} (ts=${timestamps[i]}, prev=${timestamps[i - 1]})`,
			).toBeGreaterThanOrEqual(365)
			expect(
				gap,
				`Gap at step ${i}: expected 365 or 366, got ${gap} (ts=${timestamps[i]}, prev=${timestamps[i - 1]})`,
			).toBeLessThanOrEqual(366)
		}
	})

	it('step(Year, -1) produces monotonically decreasing timestamps across 400-year boundary', () => {
		// Start a few years after the 400-year boundary and step backward
		const startTs = 146097 + 4 * 365
		let date = new EsotericDate(calendar, startTs).floor(regularYear)
		const timestamps: number[] = [date.getTimestamp()]

		for (let i = 0; i < 12; i++) {
			date = date.step(regularYear, -1)
			timestamps.push(date.getTimestamp())
		}

		for (let i = 1; i < timestamps.length; i++) {
			expect(
				timestamps[i],
				`Step ${i}: ts=${timestamps[i]} should be less than prev ts=${timestamps[i - 1]}, diff=${timestamps[i] - timestamps[i - 1]}`,
			).toBeLessThan(timestamps[i - 1])
		}

		for (let i = 1; i < timestamps.length; i++) {
			const gap = timestamps[i - 1] - timestamps[i]
			expect(
				gap,
				`Gap at step ${i}: expected 365 or 366, got ${gap} (ts=${timestamps[i]}, prev=${timestamps[i - 1]})`,
			).toBeGreaterThanOrEqual(365)
			expect(
				gap,
				`Gap at step ${i}: expected 365 or 366, got ${gap} (ts=${timestamps[i]}, prev=${timestamps[i - 1]})`,
			).toBeLessThanOrEqual(366)
		}
	})

	it('step(Year, -4) produces consistent ~4-year gaps across 100-year boundary', () => {
		// Start a few 4-year cycles after the 100-year boundary and step backward by 4
		const startTs = 36524 + 8 * 365 // ~8 years after
		let date = new EsotericDate(calendar, startTs).floor(regularYear)
		const timestamps: number[] = [date.getTimestamp()]

		for (let i = 0; i < 8; i++) {
			date = date.step(regularYear, -4)
			timestamps.push(date.getTimestamp())
		}

		// All timestamps should be monotonically decreasing
		for (let i = 1; i < timestamps.length; i++) {
			expect(
				timestamps[i],
				`Step ${i}: ts=${timestamps[i]} should be less than prev ts=${timestamps[i - 1]}`,
			).toBeLessThan(timestamps[i - 1])
		}

		// Each gap should be approximately 4 years (1460-1462 days)
		for (let i = 1; i < timestamps.length; i++) {
			const gap = timestamps[i - 1] - timestamps[i]
			expect(gap, `Gap at step ${i}: expected ~1461 (4 years), got ${gap}`).toBeGreaterThanOrEqual(4 * 365)
			expect(gap, `Gap at step ${i}: expected ~1461 (4 years), got ${gap}`).toBeLessThanOrEqual(4 * 366)
		}
	})

	it('step(Year, -4) produces consistent ~4-year gaps across 400-year boundary', () => {
		const startTs = 146097 + 8 * 365
		let date = new EsotericDate(calendar, startTs).floor(regularYear)
		const timestamps: number[] = [date.getTimestamp()]

		for (let i = 0; i < 8; i++) {
			date = date.step(regularYear, -4)
			timestamps.push(date.getTimestamp())
		}

		for (let i = 1; i < timestamps.length; i++) {
			expect(
				timestamps[i],
				`Step ${i}: ts=${timestamps[i]} should be less than prev ts=${timestamps[i - 1]}`,
			).toBeLessThan(timestamps[i - 1])
		}

		for (let i = 1; i < timestamps.length; i++) {
			const gap = timestamps[i - 1] - timestamps[i]
			expect(gap, `Gap at step ${i}: expected ~1461 (4 years), got ${gap}`).toBeGreaterThanOrEqual(4 * 365)
			expect(gap, `Gap at step ${i}: expected ~1461 (4 years), got ${gap}`).toBeLessThanOrEqual(4 * 366)
		}
	})

	it('step(Year, -4) with originTime across 400-year boundary', () => {
		const originTime = 1063468800
		const calendarWithOrigin = makeCalendar(units)
		calendarWithOrigin.originTime = originTime

		const k = Math.ceil(originTime / 146097)
		const boundaryRaw = k * 146097 - originTime

		const startTs = boundaryRaw + 8 * 365
		let date = new EsotericDate(calendarWithOrigin, startTs).floor(regularYear)
		const timestamps: number[] = [date.getTimestamp()]

		for (let i = 0; i < 10; i++) {
			date = date.step(regularYear, -4)
			timestamps.push(date.getTimestamp())
		}

		for (let i = 1; i < timestamps.length; i++) {
			expect(
				timestamps[i],
				`Step ${i}: ts=${timestamps[i]} should be less than prev ts=${timestamps[i - 1]}, diff=${timestamps[i] - timestamps[i - 1]}`,
			).toBeLessThan(timestamps[i - 1])
		}

		for (let i = 1; i < timestamps.length; i++) {
			const gap = timestamps[i - 1] - timestamps[i]
			expect(gap, `Gap at step ${i}: expected ~1461 (4 years), got ${gap}`).toBeGreaterThanOrEqual(4 * 365)
			expect(gap, `Gap at step ${i}: expected ~1461 (4 years), got ${gap}`).toBeLessThanOrEqual(4 * 366)
		}
	})

	it('step(Year, 1) forward from inside 4-year-cycle into tail Regular years', () => {
		// Start at the last year of the last 4-year-cycle (year 95 = Leap year at 34698)
		// Step forward should correctly cross into tail Regular years
		const startTs = 34698 // Leap year start in last 4-year-cycle
		let date = new EsotericDate(calendar, startTs)
		const timestamps: number[] = [date.getTimestamp()]

		for (let i = 0; i < 8; i++) {
			date = date.step(regularYear, 1)
			timestamps.push(date.getTimestamp())
		}

		for (let i = 1; i < timestamps.length; i++) {
			expect(
				timestamps[i],
				`Step ${i}: ts=${timestamps[i]} should be greater than prev ts=${timestamps[i - 1]}`,
			).toBeGreaterThan(timestamps[i - 1])
		}

		for (let i = 1; i < timestamps.length; i++) {
			const gap = timestamps[i] - timestamps[i - 1]
			expect(gap >= 365 && gap <= 366, `Gap at step ${i}: expected 365 or 366, got ${gap}`).toBe(true)
		}
	})

	it('step(Year, -1) backward and step(Year, 1) forward are symmetric', () => {
		// Step forward 20 years, then backward 20 years — should end up at the same spot
		const startTs = 36524 - 10 * 365 // near 100-year boundary
		let date = new EsotericDate(calendar, startTs).floor(regularYear)
		const original = date.getTimestamp()

		// Step forward 20
		for (let i = 0; i < 20; i++) {
			date = date.step(regularYear, 1)
		}
		const afterForward = date.getTimestamp()
		expect(afterForward).toBeGreaterThan(original)

		// Step backward 20
		for (let i = 0; i < 20; i++) {
			date = date.step(regularYear, -1)
		}
		expect(date.getTimestamp()).toBe(original)
	})
})

describe('Earth-like calendar with months (stepping months across cycle boundaries)', () => {
	// Full Earth-like hierarchy with months:
	// Day = 1, Month = 30 or 31 days, Regular year = 12 months = 365, Leap year = 366
	// 4-year cycle = Regular x3 + Leap x1 = 1461
	// 100-year cycle = 4-year-cycle x24 + Regular x4 = 36524
	// 400-year cycle = 100-year-cycle x3 + 4-year-cycle x25 = 146097

	const day = mockCalendarUnit({
		id: 'day',
		name: 'Day',
		displayName: 'Day',
		duration: 1,
		formatShorthand: 'd',
		formatMode: 'NumericOneIndexed',
		parents: [
			mockCalendarUnitParentRelation('30-day-month', 'day', 30),
			mockCalendarUnitParentRelation('31-day-month', 'day', 31),
		],
	})
	const _month30 = mockCalendarUnit({
		id: '30-day-month',
		name: '30-day month',
		displayName: 'Month',
		duration: 30,
		formatShorthand: 'M',
		formatMode: 'Name',
		children: [mockCalendarUnitChildRelation('30-day-month', 'day', 30)],
		parents: [
			mockCalendarUnitParentRelation('regular-year', '30-day-month', 4),
			mockCalendarUnitParentRelation('leap-year', '30-day-month', 4),
		],
	})
	const _month31 = mockCalendarUnit({
		id: '31-day-month',
		name: '31-day month',
		displayName: 'Month',
		duration: 31,
		formatShorthand: 'M',
		formatMode: 'Name',
		children: [mockCalendarUnitChildRelation('31-day-month', 'day', 31)],
		parents: [
			mockCalendarUnitParentRelation('regular-year', '31-day-month', 7),
			mockCalendarUnitParentRelation('leap-year', '31-day-month', 7),
		],
	})
	// Simplified: Regular year = 31+30+31+30+31+31+30+31+30+31+31+28 = 365 (pretend last is 28 but we use 30+31 pattern)
	// Actually let's use: 7 x 31-day + 5 x 30-day = 217 + 150 = 367... not right.
	// Let's simplify: Regular year = 31,30,31,30,31,31,30,31,30,31,30,31 = 366... also not right.
	// Real months: Jan(31),Feb(28/29),Mar(31),Apr(30),May(31),Jun(30),Jul(31),Aug(31),Sep(30),Oct(31),Nov(30),Dec(31)
	// = 31+28+31+30+31+30+31+31+30+31+30+31 = 365
	// So: 7 x 31-day months + 4 x 30-day months + 1 x 28-day month = 217 + 120 + 28 = 365
	// For simplicity in this test, we'll use: Regular year = 31 x6 + 30 x5 + 31 x1 = 186+150+31 = still wrong
	// Let's just use a simple pattern: 6 x 31-day + 6 x 30-day = 186 + 180 = 366... close enough
	// Actually, let's use the simplest approach: all months are 30 days, 12 per year = 360 day year
	// This isolates the stepping logic from duration complexity.

	const month = mockCalendarUnit({
		id: 'month',
		name: 'Month',
		displayName: 'Month',
		duration: 30,
		formatShorthand: 'M',
		formatMode: 'Name',
		children: [mockCalendarUnitChildRelation('month', 'day', 30)],
		parents: [
			mockCalendarUnitParentRelation('regular-year', 'month', 12),
			mockCalendarUnitParentRelation('leap-year', 'month', 12),
		],
	})
	const regularYear = mockCalendarUnit({
		id: 'regular-year',
		name: 'Regular year',
		displayName: 'Year',
		duration: 360, // 12 x 30
		formatShorthand: 'Y',
		formatMode: 'NumericOneIndexed',
		children: [mockCalendarUnitChildRelation('regular-year', 'month', 12)],
		parents: [
			mockCalendarUnitParentRelation('4-year-cycle', 'regular-year', 3),
			mockCalendarUnitParentRelation('100-year-cycle', 'regular-year', 4),
		],
	})
	const leapYear = mockCalendarUnit({
		id: 'leap-year',
		name: 'Leap year',
		displayName: 'Year',
		duration: 390, // 13 x 30 (one extra month for simplicity)
		formatShorthand: 'Y',
		formatMode: 'NumericOneIndexed',
		children: [mockCalendarUnitChildRelation('leap-year', 'month', 13)],
		parents: [mockCalendarUnitParentRelation('4-year-cycle', 'leap-year', 1)],
	})
	const fourYearCycle = mockCalendarUnit({
		id: '4-year-cycle',
		name: '4-year cycle',
		duration: 1470, // 3*360 + 390
		formatMode: 'Hidden',
		children: [
			mockCalendarUnitChildRelation('4-year-cycle', 'regular-year', 3, { position: 0 }),
			mockCalendarUnitChildRelation('4-year-cycle', 'leap-year', 1, { position: 1 }),
		],
		parents: [
			mockCalendarUnitParentRelation('100-year-cycle', '4-year-cycle', 24),
			mockCalendarUnitParentRelation('400-year-cycle', '4-year-cycle', 25),
		],
	})
	const hundredYearCycle = mockCalendarUnit({
		id: '100-year-cycle',
		name: '100-year cycle',
		duration: 36720, // 24*1470 + 4*360
		formatMode: 'Hidden',
		children: [
			mockCalendarUnitChildRelation('100-year-cycle', '4-year-cycle', 24, { position: 0 }),
			mockCalendarUnitChildRelation('100-year-cycle', 'regular-year', 4, { position: 1 }),
		],
		parents: [mockCalendarUnitParentRelation('400-year-cycle', '100-year-cycle', 3)],
	})
	const fourHundredYearCycle = mockCalendarUnit({
		id: '400-year-cycle',
		name: '400-year cycle',
		duration: 146910, // 3*36720 + 25*1470
		formatMode: 'Hidden',
		children: [
			mockCalendarUnitChildRelation('400-year-cycle', '100-year-cycle', 3, { position: 0 }),
			mockCalendarUnitChildRelation('400-year-cycle', '4-year-cycle', 25, { position: 1 }),
		],
	})
	const units = [fourHundredYearCycle, hundredYearCycle, fourYearCycle, regularYear, leapYear, month, day]
	const calendar = makeCalendar(units)

	// 100-year cycle boundary at 36720
	// Tail regular years start at 24 * 1470 = 35280
	// Year 96 = 35280, Year 97 = 35640, Year 98 = 36000, Year 99 = 36360
	// Year 100 = 36720 (next 100-year cycle)

	it('step(Month, -1) backward across year boundary within 4-year-cycle', () => {
		// Start at month 0 (first month) of a regular year
		// Within the first 4-year-cycle, year 1 starts at 360
		const startTs = 360 // Year 1, Month 0
		const date = new EsotericDate(calendar, startTs)
		const result = date.step(month, -1)
		// Should land at month 11 of year 0 = 0 + 11*30 = 330
		expect(result.getTimestamp()).toBe(330)
	})

	it('step(Month, -6) backward across year boundary', () => {
		// At year 1, month 2 (ts = 360 + 60 = 420). Step back 6 months.
		// Should land at year 0, month 8 (ts = 0 + 8*30 = 240)
		const date = new EsotericDate(calendar, 420)
		const result = date.step(month, -6)
		expect(result.getTimestamp()).toBe(240)
	})

	it('step(Month, -6) across 100-year-cycle boundary - monotonically decreasing', () => {
		// Start a few months after the 100-year boundary and step backward repeatedly
		const boundary = 36720 // 100-year boundary
		const startTs = boundary + 5 * 30 // 5 months after boundary
		let date = new EsotericDate(calendar, startTs)
		const timestamps: number[] = [date.getTimestamp()]

		for (let i = 0; i < 30; i++) {
			date = date.step(month, -6)
			timestamps.push(date.getTimestamp())
		}

		for (let i = 1; i < timestamps.length; i++) {
			const gap = timestamps[i - 1] - timestamps[i]
			expect(
				timestamps[i],
				`Step ${i}: ts=${timestamps[i]} should be less than prev ts=${timestamps[i - 1]}, gap=${gap}`,
			).toBeLessThan(timestamps[i - 1])
		}

		// Each gap should be approximately 6 months = 180 days
		for (let i = 1; i < timestamps.length; i++) {
			const gap = timestamps[i - 1] - timestamps[i]
			expect(gap, `Gap at step ${i}: expected ~180 (6 months), got ${gap}`).toBeGreaterThanOrEqual(150) // 5 months minimum
			expect(gap, `Gap at step ${i}: expected ~180 (6 months), got ${gap}`).toBeLessThanOrEqual(210) // 7 months maximum
		}
	})

	it('step(Month, -6) across 400-year-cycle boundary - monotonically decreasing', () => {
		const boundary = 146910 // 400-year boundary
		const startTs = boundary + 5 * 30
		let date = new EsotericDate(calendar, startTs)
		const timestamps: number[] = [date.getTimestamp()]

		for (let i = 0; i < 30; i++) {
			date = date.step(month, -6)
			timestamps.push(date.getTimestamp())
		}

		for (let i = 1; i < timestamps.length; i++) {
			expect(
				timestamps[i],
				`Step ${i}: ts=${timestamps[i]} should be less than prev ts=${timestamps[i - 1]}`,
			).toBeLessThan(timestamps[i - 1])
		}
	})

	it('step(Month, -6) forward and backward are symmetric', () => {
		const boundary = 36720
		const startTs = boundary + 3 * 30
		let date = new EsotericDate(calendar, startTs).floor(month)
		const original = date.getTimestamp()

		// Step forward 30 times
		for (let i = 0; i < 30; i++) {
			date = date.step(month, 6)
		}
		expect(date.getTimestamp()).toBeGreaterThan(original)

		// Step backward 30 times
		for (let i = 0; i < 30; i++) {
			date = date.step(month, -6)
		}
		expect(date.getTimestamp()).toBe(original)
	})
})

describe('EsotericDate.step — with originTime (simulating Earth 2023)', () => {
	/**
	 * Same simplified Earth calendar as above, but with a non-zero originTime.
	 * originTime = 8430 places raw timestamp 0 at year 23 of the 400-year cycle,
	 * which is at the START of a Leap year (slot 3 of 4-year cycle #5).
	 *
	 * This simulates what the real Earth 2023 calendar does: the user sees
	 * timestamp=0 as "year 2023", but the cycle hierarchy is relative to epoch year 0.
	 *
	 * Without accounting for originTime in step/floor, the code treats raw timestamp 0
	 * as the start of the root cycle, which produces wrong parent/slot resolution.
	 */

	const month = mockCalendarUnit({
		id: 'month',
		name: 'Month',
		displayName: 'month',
		duration: 30,
		formatShorthand: 'M',
		parents: [
			mockCalendarUnitParentRelation('regular-year', 'month', 12),
			mockCalendarUnitParentRelation('leap-year', 'month', 13),
		],
	})

	const regularYear = mockCalendarUnit({
		id: 'regular-year',
		name: 'RegularYear',
		displayName: 'year',
		duration: 360,
		formatShorthand: 'Y',
		formatMode: 'NumericOneIndexed',
		children: [mockCalendarUnitChildRelation('regular-year', 'month', 12)],
		parents: [
			mockCalendarUnitParentRelation('4-year-cycle', 'regular-year', 3),
			mockCalendarUnitParentRelation('100-year-cycle', 'regular-year', 4),
		],
	})

	const leapYear = mockCalendarUnit({
		id: 'leap-year',
		name: 'LeapYear',
		displayName: 'year',
		duration: 390,
		formatShorthand: 'Y',
		formatMode: 'NumericOneIndexed',
		children: [mockCalendarUnitChildRelation('leap-year', 'month', 13)],
		parents: [mockCalendarUnitParentRelation('4-year-cycle', 'leap-year', 1)],
	})

	const fourYearCycle = mockCalendarUnit({
		id: '4-year-cycle',
		name: '4YearCycle',
		displayName: '4YearCycle',
		duration: 1470,
		formatMode: 'Hidden',
		formatShorthand: '',
		children: [
			mockCalendarUnitChildRelation('4-year-cycle', 'regular-year', 3, { position: 0 }),
			mockCalendarUnitChildRelation('4-year-cycle', 'leap-year', 1, { position: 1 }),
		],
		parents: [
			mockCalendarUnitParentRelation('100-year-cycle', '4-year-cycle', 24),
			mockCalendarUnitParentRelation('400-year-cycle', '4-year-cycle', 25),
		],
	})

	const hundredYearCycle = mockCalendarUnit({
		id: '100-year-cycle',
		name: '100YearCycle',
		displayName: '100YearCycle',
		duration: 36720,
		formatMode: 'Hidden',
		formatShorthand: '',
		children: [
			mockCalendarUnitChildRelation('100-year-cycle', '4-year-cycle', 24, { position: 0 }),
			mockCalendarUnitChildRelation('100-year-cycle', 'regular-year', 4, { position: 1 }),
		],
		parents: [mockCalendarUnitParentRelation('400-year-cycle', '100-year-cycle', 3)],
	})

	const fourHundredYearCycle = mockCalendarUnit({
		id: '400-year-cycle',
		name: '400YearCycle',
		displayName: '400YearCycle',
		duration: 146910,
		formatMode: 'Hidden',
		formatShorthand: '',
		children: [
			mockCalendarUnitChildRelation('400-year-cycle', '100-year-cycle', 3, { position: 0 }),
			mockCalendarUnitChildRelation('400-year-cycle', '4-year-cycle', 25, { position: 1 }),
		],
	})

	const units: CalendarUnit[] = [
		fourHundredYearCycle,
		hundredYearCycle,
		fourYearCycle,
		regularYear,
		leapYear,
		month,
	]

	// originTime = 8430: places raw timestamp 0 at 23 years into the 400-year cycle.
	// Year 23 = 4-year cycle #5, slot 3 (Leap year).
	// Absolute position 8430: 5 * 1470 = 7350, + 3 * 360 = 1080, total = 8430 ✓
	const originTime = 8430
	const calendar = makeCalendar(units)
	const calendarWithOrigin: WorldCalendar = { ...calendar, originTime }

	// Expected raw timestamps when stepping year by year from raw 0:
	// Raw 0 = absolute 8430 = Leap year start (cycle #5, slot 3), duration 390
	// Raw 390 = absolute 8820 = cycle #6, slot 0 (Regular), duration 360
	// Raw 750 = absolute 9180 = cycle #6, slot 1 (Regular), duration 360
	// Raw 1110 = absolute 9540 = cycle #6, slot 2 (Regular), duration 360
	// Raw 1470 = absolute 9900 = cycle #6, slot 3 (Leap), duration 390
	// Raw 1860 = absolute 10290 = cycle #7, slot 0 (Regular), duration 360
	// Raw 2220 = absolute 10650 = cycle #7, slot 1 (Regular), duration 360
	// Raw 2580 = absolute 11010 = cycle #7, slot 2 (Regular), duration 360
	// Raw 2940 = absolute 11370 = cycle #7, slot 3 (Leap), duration 390
	// Raw 3330 = absolute 11760 = cycle #8, slot 0 (Regular), duration 360
	const expectedStarts = [0, 390, 750, 1110, 1470, 1860, 2220, 2580, 2940, 3330]

	it('floor at raw 0 returns 0 (already at start of Leap year)', () => {
		const date = new EsotericDate(calendarWithOrigin, 0)
		const floored = date.floor(regularYear)
		expect(floored.getTimestamp()).toBe(0)
	})

	it('floor mid-year at raw 100 returns 0', () => {
		const date = new EsotericDate(calendarWithOrigin, 100)
		const floored = date.floor(regularYear)
		expect(floored.getTimestamp()).toBe(0)
	})

	it('step from raw 0 by +1 lands at raw 390 (next Regular year)', () => {
		const date = new EsotericDate(calendarWithOrigin, 0)
		const result = date.step(regularYear, 1)
		expect(result.getTimestamp()).toBe(390)
	})

	it('step through 10 years sequentially, each landing at the correct start', () => {
		let date = new EsotericDate(calendarWithOrigin, 0).floor(regularYear)

		for (let i = 0; i < expectedStarts.length; i++) {
			expect(date.getTimestamp(), `Year ${i} should start at ${expectedStarts[i]}`).toBe(expectedStarts[i])
			if (i < expectedStarts.length - 1) {
				date = date.step(regularYear, 1)
			}
		}
	})

	it('all gaps between years are either 360 (regular) or 390 (leap)', () => {
		let date = new EsotericDate(calendarWithOrigin, 0).floor(regularYear)
		const timestamps: number[] = [date.getTimestamp()]

		for (let i = 0; i < 9; i++) {
			date = date.step(regularYear, 1)
			timestamps.push(date.getTimestamp())
		}

		for (let i = 1; i < timestamps.length; i++) {
			const gap = timestamps[i] - timestamps[i - 1]
			expect(
				gap === 360 || gap === 390,
				`Gap between year ${i} and ${i - 1} should be 360 or 390, got ${gap}`,
			).toBe(true)
		}
	})

	it('floor mid-year then step reproduces timeline anchor behavior', () => {
		// Start mid-year at raw 200 (within the Leap year that starts at raw 0)
		const base = new EsotericDate(calendarWithOrigin, 200).floor(regularYear)
		expect(base.getTimestamp()).toBe(0)

		const next = base.step(regularYear, 1)
		expect(next.getTimestamp()).toBe(390)

		const nextNext = next.step(regularYear, 1)
		expect(nextNext.getTimestamp()).toBe(750)
	})

	it('step +4 from raw 0 crosses 4-year cycle boundary correctly', () => {
		// From raw 0 (Leap year), step +4 should land at raw 1470 (next Leap year)
		const date = new EsotericDate(calendarWithOrigin, 0)
		const result = date.step(regularYear, 4)
		expect(result.getTimestamp()).toBe(1470)
	})

	it('step +1000 years advances by exactly 1000 years of time', () => {
		const date = new EsotericDate(calendarWithOrigin, 0).floor(regularYear)
		const stepped = date.step(regularYear, 1000)

		const gap = stepped.getTimestamp() - date.getTimestamp()

		// 1000 years should be between 1000*360=360000 (all regular) and 1000*390=390000 (all leap)
		expect(gap).toBeGreaterThan(360000)
		expect(gap).toBeLessThan(390000)
	})

	it('step +1000 then get(Year) shows value advanced by exactly 1000', () => {
		const date = new EsotericDate(calendarWithOrigin, 0).floor(regularYear)
		const yearBefore = date.get(regularYear)!.value

		const stepped = date.step(regularYear, 1000)
		const yearAfter = stepped.get(regularYear)!.value

		expect(yearAfter - yearBefore).toBe(1000)
	})

	it('repeated step +1000 always advances year value by exactly 1000', () => {
		let date = new EsotericDate(calendarWithOrigin, 0).floor(regularYear)

		for (let i = 0; i < 5; i++) {
			const yearBefore = date.get(regularYear)!.value
			date = date.step(regularYear, 1000)
			const yearAfter = date.get(regularYear)!.value
			expect(yearAfter - yearBefore, `Step ${i}: year should advance by 1000`).toBe(1000)
		}
	})

	it('step +100 advances year value by exactly 100', () => {
		const date = new EsotericDate(calendarWithOrigin, 0).floor(regularYear)
		const yearBefore = date.get(regularYear)!.value
		const stepped = date.step(regularYear, 100)
		const yearAfter = stepped.get(regularYear)!.value
		expect(yearAfter - yearBefore).toBe(100)
	})

	it('step +4 advances year value by exactly 4', () => {
		const date = new EsotericDate(calendarWithOrigin, 0).floor(regularYear)
		const yearBefore = date.get(regularYear)!.value
		const stepped = date.step(regularYear, 4)
		const yearAfter = stepped.get(regularYear)!.value
		expect(yearAfter - yearBefore).toBe(4)
	})

	it('step -1000 decreases year value by exactly 1000', () => {
		// Start at a known position well above year 1000
		const date = new EsotericDate(calendarWithOrigin, 367500).floor(regularYear)
		const yearBefore = date.get(regularYear)!.value

		const stepped = date.step(regularYear, -1000)
		const yearAfter = stepped.get(regularYear)!.value

		expect(yearBefore - yearAfter).toBe(1000)
	})

	it('find smallest step that loses a year', () => {
		const date = new EsotericDate(calendarWithOrigin, 0).floor(regularYear)
		const yearBefore = date.get(regularYear)!.value
		const failures: number[] = []
		for (const n of [472, 473]) {
			const stepped = date.step(regularYear, n)
			const yearAfter = stepped.get(regularYear)!.value
			const diff = yearAfter - yearBefore
			if (diff !== n) {
				failures.push(n)
				console.info(
					`step(+${n}): expected year ${yearBefore + n}, got ${yearAfter} (diff=${diff}), ts=${stepped.getTimestamp()}`,
				)
			}
		}
		expect(failures, `These step sizes lost years: ${failures.join(', ')}`).toEqual([])
	})

	it('step-by-1 around the 473 boundary to find where drift occurs', () => {
		// Start at year 23 (0-indexed), step to year 475 one at a time, check each
		let date = new EsotericDate(calendarWithOrigin, 0).floor(regularYear)
		// First, jump to year 460 (known good range)
		date = date.step(regularYear, 460)

		// Now step by 1, logging each year value
		const log: string[] = []
		for (let i = 0; i < 20; i++) {
			const prevYear = date.get(regularYear)!.value
			const prevTs = date.getTimestamp()
			date = date.step(regularYear, 1)
			const newYear = date.get(regularYear)!.value
			const newTs = date.getTimestamp()
			const gap = newTs - prevTs
			const yearDiff = newYear - prevYear
			if (yearDiff !== 1) {
				log.push(`Year ${prevYear}→${newYear} (diff=${yearDiff}, gap=${gap}, ts=${prevTs}→${newTs})`)
			}
		}
		expect(log, `Step-by-1 drift detected:\n${log.join('\n')}`).toEqual([])
	})
})

describe('large step amounts (must not recurse once per parent-cycle crossing)', () => {
	describe('root is the immediate parent (Hour → Minute)', () => {
		const minute = mockCalendarUnit({
			id: 'minute',
			name: 'Minute',
			duration: 1,
			formatShorthand: 'm',
			position: 0,
			parents: [mockCalendarUnitParentRelation('hour', 'minute', 60)],
		})
		const hour = mockCalendarUnit({
			id: 'hour',
			name: 'Hour',
			duration: 60,
			formatShorthand: 'h',
			position: 1,
			children: [mockCalendarUnitChildRelation('hour', 'minute', 60)],
		})
		const calendar = makeCalendar([minute, hour])

		it('step(Minute, ±1e6)', () => {
			expect(new EsotericDate(calendar, 0).step(minute, 1_000_000).getTimestamp()).toBe(1_000_000)
			expect(new EsotericDate(calendar, 0).step(minute, -1_000_000).getTimestamp()).toBe(-1_000_000)
			expect(new EsotericDate(calendar, 17).step(minute, 1_000_000).getTimestamp()).toBe(1_000_017)
		})

		it('step(Hour, ±1e6)', () => {
			expect(new EsotericDate(calendar, 0).step(hour, 1_000_000).getTimestamp()).toBe(60_000_000)
			expect(new EsotericDate(calendar, 5).step(hour, -1_000_000).getTimestamp()).toBe(-60_000_000 + 5)
		})
	})

	describe('Earth calendar (target unit nested several levels below the root cycle)', () => {
		const calendar = mockEarthCalendar()
		const unit = (id: string) => calendar.units.find((u) => u.id === id)!
		const minute = unit('minute')
		const hour = unit('hour')
		const day = unit('day')
		const month = unit('31-day-month')
		const year = unit('regular-year')

		it('step(Minute, ±1e6)', () => {
			expect(new EsotericDate(calendar, 0).step(minute, 1_000_000).getTimestamp()).toBe(1_000_000)
			expect(new EsotericDate(calendar, 0).step(minute, -1_000_000).getTimestamp()).toBe(-1_000_000)
		})

		it('step(Hour, ±1e5 and ±1e6)', () => {
			expect(new EsotericDate(calendar, 0).step(hour, 100_000).getTimestamp()).toBe(100_000 * EARTH.HOUR)
			expect(new EsotericDate(calendar, 0).step(hour, -100_000).getTimestamp()).toBe(-100_000 * EARTH.HOUR)
			expect(new EsotericDate(calendar, 0).step(hour, 1_000_000).getTimestamp()).toBe(1_000_000 * EARTH.HOUR)
		})

		it('step(Day, ±1e5 and ±1e6) preserves the time of day', () => {
			const start = 5 * EARTH.HOUR + 7
			expect(new EsotericDate(calendar, start).step(day, 100_000).getTimestamp()).toBe(
				100_000 * EARTH.DAY + start,
			)
			expect(new EsotericDate(calendar, start).step(day, -100_000).getTimestamp()).toBe(
				-100_000 * EARTH.DAY + start,
			)
			expect(new EsotericDate(calendar, start).step(day, 1_000_000).getTimestamp()).toBe(
				1_000_000 * EARTH.DAY + start,
			)
		})

		it('step(Month, 12n) equals step(Year, n) from the start of a year', () => {
			for (const years of [100, 1_000, 10_000]) {
				const viaMonths = new EsotericDate(calendar, 0).step(month, 12 * years)
				const viaYears = new EsotericDate(calendar, 0).step(year, years)
				expect(viaMonths.getTimestamp(), `years=${years}`).toBe(viaYears.getTimestamp())
				expect(viaMonths.get(year)?.value, `years=${years}`).toBe(years)
			}
		})

		it('step(Month, -12n) equals step(Year, -n) from the start of a year', () => {
			for (const years of [100, 1_000, 10_000]) {
				const viaMonths = new EsotericDate(calendar, 0).step(month, -12 * years)
				const viaYears = new EsotericDate(calendar, 0).step(year, -years)
				expect(viaMonths.getTimestamp(), `years=${years}`).toBe(viaYears.getTimestamp())
			}
		})

		it('step(Year, ±1e6) stays cheap and exact', () => {
			expect(new EsotericDate(calendar, 0).step(year, 1_000_000).get(year)?.value).toBe(1_000_000)
			expect(new EsotericDate(calendar, 0).step(year, -1_000_000).get(year)?.value).toBe(-1_000_000)
		})

		it('large forward and backward steps are symmetric', () => {
			const start = 3 * EARTH.DAY + 11 * EARTH.HOUR + 42
			for (const [u, n] of [
				[minute, 1_000_000],
				[hour, 100_000],
				[day, 100_000],
				[month, 10_000],
				[year, 100_000],
			] as const) {
				const there = new EsotericDate(calendar, start).step(u, n)
				expect(there.step(u, -n).getTimestamp(), `${u.name} ±${n}`).toBe(start)
			}
		})
	})
})
