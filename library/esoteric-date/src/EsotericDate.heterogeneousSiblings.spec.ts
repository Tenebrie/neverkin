import { describe, expect, it } from 'vitest'

import {
	mockCalendar,
	mockCalendarUnit,
	mockCalendarUnitChildRelation,
	mockCalendarUnitParentRelation,
} from '@/api/mock/rheaModels.mock'
import { WorldCalendar } from '@/api/types/worldTypes'

import { EsotericDate } from './EsotericDate'

/**
 * A year made of different unit kinds at the same level, in this order:
 *
 *   Year → [Month x2, Day x3, Month x4, Cow x2, Banana x1, Month x1]
 *   Month → [Day x30]
 *
 * Durations: Day = 1, Cow = 5, Banana = 7, Month = 30, Year = 230.
 *
 * Absolute layout of year 0:
 *
 *   [0, 60)     Month 0..1
 *   [60, 63)    Day 0..2 (directly under Year)
 *   [63, 183)   Month 2..5
 *   [183, 193)  Cow 0..1
 *   [193, 200)  Banana 0
 *   [200, 230)  Month 6
 *
 * Day is both a grandchild (via Month) and a direct child of Year.
 */
const DAY = 1
const COW = 5
const BANANA = 7
const MONTH = 30 * DAY
const YEAR = 2 * MONTH + 3 * DAY + 4 * MONTH + 2 * COW + BANANA + MONTH

const yearChildren = [
	mockCalendarUnitChildRelation('year', 'month', 2, { id: 'year-months-a', position: 0 }),
	mockCalendarUnitChildRelation('year', 'day', 3, { id: 'year-days', position: 1 }),
	mockCalendarUnitChildRelation('year', 'month', 4, { id: 'year-months-b', position: 2 }),
	mockCalendarUnitChildRelation('year', 'cow', 2, { id: 'year-cows', position: 3 }),
	mockCalendarUnitChildRelation('year', 'banana', 1, { id: 'year-banana', position: 4 }),
	mockCalendarUnitChildRelation('year', 'month', 1, { id: 'year-months-c', position: 5 }),
]

const day = mockCalendarUnit({
	id: 'day',
	name: 'Day',
	duration: DAY,
	formatShorthand: 'd',
	formatMode: 'Numeric',
	position: 0,
	parents: [
		mockCalendarUnitParentRelation('month', 'day', 30),
		mockCalendarUnitParentRelation('year', 'day', 3, { id: 'year-days', position: 1 }),
	],
})

const cow = mockCalendarUnit({
	id: 'cow',
	name: 'Cow',
	duration: COW,
	formatShorthand: 'c',
	formatMode: 'Numeric',
	position: 1,
	parents: [mockCalendarUnitParentRelation('year', 'cow', 2, { id: 'year-cows', position: 3 })],
})

const banana = mockCalendarUnit({
	id: 'banana',
	name: 'Banana',
	duration: BANANA,
	formatShorthand: 'b',
	formatMode: 'Numeric',
	position: 2,
	parents: [mockCalendarUnitParentRelation('year', 'banana', 1, { id: 'year-banana', position: 4 })],
})

const month = mockCalendarUnit({
	id: 'month',
	name: 'Month',
	duration: MONTH,
	formatShorthand: 'M',
	formatMode: 'Numeric',
	position: 3,
	children: [mockCalendarUnitChildRelation('month', 'day', 30)],
	parents: [
		mockCalendarUnitParentRelation('year', 'month', 2, { id: 'year-months-a', position: 0 }),
		mockCalendarUnitParentRelation('year', 'month', 4, { id: 'year-months-b', position: 2 }),
		mockCalendarUnitParentRelation('year', 'month', 1, { id: 'year-months-c', position: 5 }),
	],
})

const year = mockCalendarUnit({
	id: 'year',
	name: 'Year',
	duration: YEAR,
	formatShorthand: 'Y',
	formatMode: 'Numeric',
	position: 4,
	children: yearChildren,
})

const units = [day, cow, banana, month, year]

function makeCalendar(dateFormat: string): WorldCalendar {
	return mockCalendar({ dateFormat, units })
}

const calendar = makeCalendar('Y M d')

function at(timestamp: number) {
	return new EsotericDate(calendar, timestamp)
}

function expectRoundTrip(cal: WorldCalendar, timestamps: number[]) {
	for (const timestamp of timestamps) {
		const formatted = new EsotericDate(cal, timestamp).format()
		const parsed = new EsotericDate(cal, 0).fromFormatted(formatted)
		expect(parsed.getTimestamp(), `"${formatted}" (from t=${timestamp})`).toBe(timestamp)
	}
}

describe('heterogeneous sibling units (Year → [Month x2, Day x3, Month x4, Cow x2, Banana x1, Month x1])', () => {
	it('sanity: the year is 230 units long', () => {
		expect(YEAR).toBe(230)
	})

	describe('parsing (get / format)', () => {
		it('day-of-month restarts at 0 in every month, including months after the direct days', () => {
			expect(at(0).get(day)?.value).toBe(0)
			expect(at(30).get(day)?.value).toBe(0)
			expect(at(59).get(day)?.value).toBe(29)
			expect(at(63).get(day)?.value).toBe(0)
			expect(at(78).get(day)?.value).toBe(15)
			expect(at(153).get(day)?.value).toBe(0)
			expect(at(200).get(day)?.value).toBe(0)
			expect(at(229).get(day)?.value).toBe(29)
		})

		it('month index counts across the direct days, cows and banana', () => {
			expect(at(0).get(month)?.value).toBe(0)
			expect(at(30).get(month)?.value).toBe(1)
			expect(at(63).get(month)?.value).toBe(2)
			expect(at(153).get(month)?.value).toBe(5)
			expect(at(200).get(month)?.value).toBe(6)
		})

		it('direct days under the year count every day of the year before them and have no month', () => {
			expect(at(60).get(day)?.value).toBe(60)
			expect(at(61).get(day)?.value).toBe(61)
			expect(at(62).get(day)?.value).toBe(62)
			expect(at(61).get(month)).toBeUndefined()
		})

		it('cows and banana are indexed within the year', () => {
			expect(at(183).get(cow)?.value).toBe(0)
			expect(at(188).get(cow)?.value).toBe(1)
			expect(at(190).get(cow)?.value).toBe(1)
			expect(at(193).get(banana)?.value).toBe(0)
			expect(at(199).get(banana)?.value).toBe(0)
		})

		it('get() returns undefined (does not throw) for a unit that has no instance at this timestamp', () => {
			expect(at(185).get(day)).toBeUndefined()
			expect(at(185).get(month)).toBeUndefined()
			expect(at(195).get(cow)).toBeUndefined()
			expect(at(30).get(cow)).toBeUndefined()
			expect(at(30).get(banana)).toBeUndefined()
		})

		it('year value is correct everywhere, including inside cows and in negative time', () => {
			expect(at(185).get(year)?.value).toBe(0)
			expect(at(229).get(year)?.value).toBe(0)
			expect(at(230).get(year)?.value).toBe(1)
			expect(at(-1).get(year)?.value).toBe(-1)
			expect(at(-1).get(month)?.value).toBe(6)
			expect(at(-1).get(day)?.value).toBe(29)
		})

		it('formats month days without the direct-day leak', () => {
			expect(at(0).format()).toBe('0 0 0')
			expect(at(59).format()).toBe('0 1 29')
			expect(at(63).format()).toBe('0 2 0')
			expect(at(153).format()).toBe('0 5 0')
			expect(at(200).format()).toBe('0 6 0')
			expect(at(296).format()).toBe('1 2 3')
		})
	})

	describe('floor', () => {
		it('floors to the start of the active instance of the unit', () => {
			expect(at(45).floor(month).getTimestamp()).toBe(30)
			expect(at(75).floor(month).getTimestamp()).toBe(63)
			expect(at(215).floor(month).getTimestamp()).toBe(200)
			expect(at(61).floor(day).getTimestamp()).toBe(61)
			expect(at(190).floor(cow).getTimestamp()).toBe(188)
			expect(at(199).floor(banana).getTimestamp()).toBe(193)
			expect(at(185).floor(year).getTimestamp()).toBe(0)
			expect(at(-5).floor(year).getTimestamp()).toBe(-230)
		})
	})

	describe('round', () => {
		it('rounds to the nearer cow boundary', () => {
			expect(at(184).round(cow).getTimestamp()).toBe(183)
			expect(at(186).round(cow).getTimestamp()).toBe(188)
		})

		it('rounds month 5 → month 5 when the next month is far away (past cows and banana)', () => {
			expect(at(170).round(month).getTimestamp()).toBe(153)
		})
	})

	describe('stepping months', () => {
		it('steps over the direct days between month 1 and month 2', () => {
			expect(at(0).step(month, 1).getTimestamp()).toBe(30)
			expect(at(30).step(month, 1).getTimestamp()).toBe(63)
			expect(at(63).step(month, -1).getTimestamp()).toBe(30)
		})

		it('steps over the cows and banana between month 5 and month 6', () => {
			expect(at(153).step(month, 1).getTimestamp()).toBe(200)
			expect(at(200).step(month, -1).getTimestamp()).toBe(153)
		})

		it('steps across the year boundary', () => {
			expect(at(200).step(month, 1).getTimestamp()).toBe(230)
			expect(at(0).step(month, -1).getTimestamp()).toBe(200 - YEAR)
			expect(at(0).step(month, 7).getTimestamp()).toBe(YEAR)
			expect(at(0).step(month, 14).getTimestamp()).toBe(2 * YEAR)
			expect(at(0).step(month, -7).getTimestamp()).toBe(-YEAR)
		})

		it('preserves the day-of-month offset', () => {
			expect(at(45).step(month, 1).getTimestamp()).toBe(63 + 15)
			expect(at(59).step(month, 1).getTimestamp()).toBe(63 + 29)
			expect(at(168).step(month, 1).getTimestamp()).toBe(200 + 15)
			expect(at(215).step(month, -1).getTimestamp()).toBe(153 + 15)
		})

		it('forward and backward are symmetric', () => {
			for (const start of [0, 30, 63, 93, 153, 200]) {
				for (const n of [1, 2, 5, 7, 13]) {
					expect(at(start).step(month, n).step(month, -n).getTimestamp(), `start=${start} n=${n}`).toBe(start)
				}
			}
		})
	})

	describe('stepping days', () => {
		it('steps within a month', () => {
			expect(at(0).step(day, 1).getTimestamp()).toBe(1)
			expect(at(63).step(day, 10).getTimestamp()).toBe(73)
			expect(at(73).step(day, -10).getTimestamp()).toBe(63)
		})

		it('steps from the last day of month 1 into the first direct day', () => {
			expect(at(59).step(day, 1).getTimestamp()).toBe(60)
			expect(at(60).step(day, -1).getTimestamp()).toBe(59)
		})

		it('steps between direct days', () => {
			expect(at(60).step(day, 1).getTimestamp()).toBe(61)
			expect(at(60).step(day, 2).getTimestamp()).toBe(62)
			expect(at(62).step(day, -2).getTimestamp()).toBe(60)
		})

		it('steps from the last direct day into the first day of month 2', () => {
			expect(at(62).step(day, 1).getTimestamp()).toBe(63)
			expect(at(63).step(day, -1).getTimestamp()).toBe(62)
		})

		it('steps across the direct days as a contiguous run', () => {
			expect(at(30).step(day, 33).getTimestamp()).toBe(63)
			expect(at(63).step(day, -33).getTimestamp()).toBe(30)
			expect(at(58).step(day, 5).getTimestamp()).toBe(63)
		})

		it('steps from the last day of month 5 over the cows and banana into month 6', () => {
			expect(at(182).step(day, 1).getTimestamp()).toBe(200)
			expect(at(200).step(day, -1).getTimestamp()).toBe(182)
			expect(at(180).step(day, 5).getTimestamp()).toBe(202)
		})

		it('steps across the year boundary', () => {
			expect(at(229).step(day, 1).getTimestamp()).toBe(230)
			expect(at(0).step(day, -1).getTimestamp()).toBe(-1)
			expect(at(-1).step(day, 1).getTimestamp()).toBe(0)
		})

		it('a full year is 213 days (230 minus 10 cow and 7 banana units)', () => {
			expect(at(0).step(day, 213).getTimestamp()).toBe(YEAR)
			expect(at(0).step(day, -213).getTimestamp()).toBe(-YEAR)
			expect(at(0).step(day, 426).getTimestamp()).toBe(2 * YEAR)
		})

		it('forward and backward are symmetric', () => {
			for (const start of [0, 59, 60, 62, 63, 182, 200, 229]) {
				for (const n of [1, 3, 4, 31, 120, 213, 250]) {
					expect(at(start).step(day, n).step(day, -n).getTimestamp(), `start=${start} n=${n}`).toBe(start)
				}
			}
		})

		it('stepping by one always advances to the next day instance', () => {
			const expected = [
				...Array.from({ length: 63 }, (_, i) => i),
				...Array.from({ length: 120 }, (_, i) => 63 + i),
				...Array.from({ length: 30 }, (_, i) => 200 + i),
				YEAR,
			]
			let date = at(0)
			const actual = [0]
			for (let i = 1; i < expected.length; i++) {
				date = date.step(day, 1)
				actual.push(date.getTimestamp())
			}
			expect(actual).toEqual(expected)
		})
	})

	describe('stepping cows', () => {
		it('steps between the two cows', () => {
			expect(at(183).step(cow, 1).getTimestamp()).toBe(188)
			expect(at(188).step(cow, -1).getTimestamp()).toBe(183)
		})

		it('steps to the same cow in the next and previous year', () => {
			expect(at(188).step(cow, 1).getTimestamp()).toBe(YEAR + 183)
			expect(at(183).step(cow, 2).getTimestamp()).toBe(YEAR + 183)
			expect(at(183).step(cow, -1).getTimestamp()).toBe(188 - YEAR)
			expect(at(183).step(cow, 4).getTimestamp()).toBe(2 * YEAR + 183)
		})

		it('steps from a timestamp outside any cow relative to the latest cow before it', () => {
			expect(at(0).step(cow, 1).getTimestamp()).toBe(183)
			expect(at(100).step(cow, 1).getTimestamp()).toBe(183)
			expect(at(200).step(cow, 1).getTimestamp()).toBe(YEAR + 183)
			expect(at(200).step(cow, -1).getTimestamp()).toBe(183)
		})

		it('floors within the cow before stepping (no sub-cow offset to preserve)', () => {
			expect(at(185).step(cow, 1).getTimestamp()).toBe(188)
		})

		it('forward and backward are symmetric', () => {
			for (const start of [183, 188]) {
				for (const n of [1, 2, 3, 10]) {
					expect(at(start).step(cow, n).step(cow, -n).getTimestamp(), `start=${start} n=${n}`).toBe(start)
				}
			}
		})
	})

	describe('stepping bananas', () => {
		it('steps to the banana of the next and previous year', () => {
			expect(at(193).step(banana, 1).getTimestamp()).toBe(YEAR + 193)
			expect(at(193).step(banana, -1).getTimestamp()).toBe(193 - YEAR)
			expect(at(193).step(banana, 3).getTimestamp()).toBe(3 * YEAR + 193)
		})

		it('steps from a timestamp outside any banana relative to the latest banana before it', () => {
			expect(at(0).step(banana, 1).getTimestamp()).toBe(193)
			expect(at(185).step(banana, 1).getTimestamp()).toBe(193)
			expect(at(200).step(banana, 1).getTimestamp()).toBe(YEAR + 193)
			expect(at(200).step(banana, -1).getTimestamp()).toBe(193 - YEAR)
		})
	})

	describe('stepping years', () => {
		it('preserves the position within the year', () => {
			expect(at(0).step(year, 1).getTimestamp()).toBe(YEAR)
			expect(at(78).step(year, 1).getTimestamp()).toBe(YEAR + 78)
			expect(at(61).step(year, 1).getTimestamp()).toBe(YEAR + 61)
			expect(at(188).step(year, 1).getTimestamp()).toBe(YEAR + 188)
			expect(at(193).step(year, -1).getTimestamp()).toBe(193 - YEAR)
		})
	})

	describe('fromFormatted', () => {
		it('resolves month and day', () => {
			expect(at(0).fromFormatted('0 0 0').getTimestamp()).toBe(0)
			expect(at(0).fromFormatted('0 2 0').getTimestamp()).toBe(63)
			expect(at(0).fromFormatted('0 6 0').getTimestamp()).toBe(200)
			expect(at(0).fromFormatted('1 2 3').getTimestamp()).toBe(YEAR + 63 + 3)
			expect(at(0).fromFormatted('-1 6 29').getTimestamp()).toBe(-1)
		})

		it('resolves cows and bananas', () => {
			const cows = makeCalendar('Y c')
			expect(new EsotericDate(cows, 0).fromFormatted('0 0').getTimestamp()).toBe(183)
			expect(new EsotericDate(cows, 0).fromFormatted('0 1').getTimestamp()).toBe(188)
			expect(new EsotericDate(cows, 0).fromFormatted('2 1').getTimestamp()).toBe(2 * YEAR + 188)

			const bananas = makeCalendar('Y b')
			expect(new EsotericDate(bananas, 0).fromFormatted('0 0').getTimestamp()).toBe(193)
			expect(new EsotericDate(bananas, 0).fromFormatted('-1 0').getTimestamp()).toBe(193 - YEAR)
		})

		it('round-trips timestamps inside months', () => {
			expectRoundTrip(calendar, [0, 15, 30, 59, 63, 78, 153, 182, 200, 229, YEAR, YEAR + 66, -1, -30, -YEAR])
		})

		it('round-trips timestamps inside cows and bananas', () => {
			expectRoundTrip(makeCalendar('Y c'), [183, 188, YEAR + 183, 188 - YEAR])
			expectRoundTrip(makeCalendar('Y b'), [193, YEAR + 193, 193 - YEAR])
		})

		it('round-trips direct days through a year-and-day format', () => {
			expectRoundTrip(makeCalendar('Y d'), [60, 61, 62, YEAR + 60, 60 - YEAR])
		})
	})
})
