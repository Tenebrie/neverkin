import { describe, expect, it } from 'vitest'

import {
	mockCalendar,
	mockCalendarUnit,
	mockCalendarUnitChildRelation,
	mockCalendarUnitParentRelation,
} from '@/api/mock/rheaModels.mock'
import { CalendarUnit } from '@/api/types/calendarTypes'
import { WorldCalendar } from '@/api/types/worldTypes'

import { EsotericDate } from './EsotericDate'

function makeCalendar(units: CalendarUnit[]): WorldCalendar {
	return mockCalendar({ units })
}

describe('EsotericDate.addTime', () => {
	describe('simple single-level calendar (Hour → Minute)', () => {
		// Hour = 60 duration, contains Minute x60 (duration 1 each)
		const minute = mockCalendarUnit({
			id: 'minute',
			name: 'Minute',
			duration: 1,
			formatShorthand: 'i',
			parents: [mockCalendarUnitParentRelation('hour', 'minute', 60)],
		})
		const hour = mockCalendarUnit({
			id: 'hour',
			name: 'Hour',
			duration: 60,
			formatShorthand: 'h',
			children: [mockCalendarUnitChildRelation('hour', 'minute', 60)],
		})
		const units: CalendarUnit[] = [hour, minute]
		const calendar = makeCalendar(units)

		it('adds 1 minute from minute 34 → minute 35', () => {
			// timestamp 34 = hour 0, minute 34
			const date = new EsotericDate(calendar, 34)
			const result = date.step(minute, 1)
			expect(result.getTimestamp()).toBe(35)
		})

		it('adds 1 minute from minute 59 → overflows to next hour minute 0', () => {
			// timestamp 59 = hour 0, minute 59. +1 → hour 1, minute 0 = 60
			const date = new EsotericDate(calendar, 59)
			const result = date.step(minute, 1)
			expect(result.getTimestamp()).toBe(60)
		})

		it('adds 5 minutes from minute 57 → overflows to next hour minute 2', () => {
			// timestamp 57 = hour 0, minute 57. +5 → 5 steps forward = minute 62 = hour 1, minute 2
			const date = new EsotericDate(calendar, 57)
			const result = date.step(minute, 5)
			expect(result.getTimestamp()).toBe(62)
		})

		it('adds 0 minutes → returns same timestamp', () => {
			const date = new EsotericDate(calendar, 34)
			const result = date.step(minute, 0)
			expect(result.getTimestamp()).toBe(34)
		})

		it('subtracts 1 minute from minute 5 → minute 4', () => {
			const date = new EsotericDate(calendar, 5)
			const result = date.step(minute, -1)
			expect(result.getTimestamp()).toBe(4)
		})

		it('subtracts 1 minute from minute 0 → underflows to previous hour minute 59', () => {
			// timestamp 60 = hour 1, minute 0. -1 → hour 0, minute 59 = 59
			const date = new EsotericDate(calendar, 60)
			const result = date.step(minute, -1)
			expect(result.getTimestamp()).toBe(59)
		})

		it('adds 1 hour (root unit) → adds 60 to timestamp', () => {
			const date = new EsotericDate(calendar, 34)
			const result = date.step(hour, 1)
			expect(result.getTimestamp()).toBe(94)
		})

		it('adds 60 minutes → exactly one hour forward', () => {
			const date = new EsotericDate(calendar, 34)
			const result = date.step(minute, 60)
			expect(result.getTimestamp()).toBe(94)
		})
	})

	describe('mixed children with different durations (Hour → [Minute x5, Subunit x10, Minute x3])', () => {
		// Hour has 18 slots total. Minute duration=3, Subunit duration=1.
		// Hour total = 5*3 + 10*1 + 3*3 = 15 + 10 + 9 = 34
		const minute = mockCalendarUnit({
			id: 'minute',
			name: 'Minute',
			duration: 3,
			formatShorthand: 'i',
			parents: [mockCalendarUnitParentRelation('hour', 'minute', 5)],
		})
		const subunit = mockCalendarUnit({
			id: 'subunit',
			name: 'Subunit',
			duration: 1,
			formatShorthand: 's',
			parents: [mockCalendarUnitParentRelation('hour', 'subunit', 10)],
		})
		const minuteB = mockCalendarUnit({
			id: 'minute-b',
			name: 'MinuteB',
			displayName: 'Minute',
			duration: 3,
			formatShorthand: 'i',
			parents: [mockCalendarUnitParentRelation('hour', 'minute-b', 3)],
		})
		const hour = mockCalendarUnit({
			id: 'hour',
			name: 'Hour',
			duration: 34,
			formatShorthand: 'h',
			children: [
				mockCalendarUnitChildRelation('hour', 'minute', 5, { position: 0 }),
				mockCalendarUnitChildRelation('hour', 'subunit', 10, { position: 1 }),
				mockCalendarUnitChildRelation('hour', 'minute-b', 3, { position: 2 }),
			],
		})
		const units: CalendarUnit[] = [hour, minute, subunit, minuteB]
		const calendar = makeCalendar(units)

		it('steps from minute 3 → minute 4 (same batch)', () => {
			// Minute 3 = slot index 3, offset = 3*3 = 9
			// +1 → slot index 4 (minute 4), offset = 4*3 = 12
			const date = new EsotericDate(calendar, 9)
			const result = date.step(minute, 1)
			expect(result.getTimestamp()).toBe(12)
		})

		it('steps from minute 4 (last in first batch) to minuteB 0 (first of second batch), skipping subunit', () => {
			// Minute 4 = offset 4*3 = 12
			// +1 minute → skips 10 subunit transparently → minuteB 0 = 5*3 + 10*1 = 25
			const date = new EsotericDate(calendar, 12)
			const result = date.step(minute, 1)
			expect(result.getTimestamp()).toBe(25)
		})

		it('steps from subunit 9 (last subunit) to subunit 0 of the next hour, skipping the minutes between', () => {
			// Subunit 9 = offset 5*3 + 9*1 = 24
			// +1 subunit → next hour starts at 34, its first subunit follows 5 minutes = 34 + 15 = 49
			const date = new EsotericDate(calendar, 24)
			const result = date.step(subunit, 1)
			expect(result.getTimestamp()).toBe(49)
		})

		it('steps through 8 minute slots per hour, +18 minutes = 2 full hours + 2 extra', () => {
			// 8 minute slots per hour (5 + 3). +18 = 2*8 full hours (lands at 68) + 2 more
			// minute 1 of hour 2 = 68 + 3 = 71, minute 2 = 68 + 6 = 74
			const date = new EsotericDate(calendar, 0)
			const result = date.step(minute, 18)
			expect(result.getTimestamp()).toBe(74)
		})

		it('steps backward from minute 0 to previous hour last slot (minuteB 2 = minute 7)', () => {
			// timestamp 34 = hour 1, minute 0 (slot 0)
			// -1 → slot 17 (minuteB 2 = minute 7), hour 0
			// hour 0 slot 17 offset = 5*3 + 10*1 + 2*3 = 15 + 10 + 6 = 31
			const date = new EsotericDate(calendar, 34)
			const result = date.step(minute, -1)
			expect(result.getTimestamp()).toBe(31)
		})
	})

	describe('child preservation (Day → Hour → Minute)', () => {
		// Minute (dur=1), Hour (dur=60, contains Minute x60), Day (dur=1440, contains Hour x24)
		const minute = mockCalendarUnit({
			id: 'minute',
			name: 'Minute',
			duration: 1,
			formatShorthand: 'i',
			parents: [mockCalendarUnitParentRelation('hour', 'minute', 60)],
		})
		const hour = mockCalendarUnit({
			id: 'hour',
			name: 'Hour',
			duration: 60,
			formatShorthand: 'h',
			children: [mockCalendarUnitChildRelation('hour', 'minute', 60)],
			parents: [mockCalendarUnitParentRelation('day', 'hour', 24)],
		})
		const day = mockCalendarUnit({
			id: 'day',
			name: 'Day',
			duration: 1440,
			formatShorthand: 'd',
			children: [mockCalendarUnitChildRelation('day', 'hour', 24)],
		})
		const units: CalendarUnit[] = [day, hour, minute]
		const calendar = makeCalendar(units)

		it('adding 1 hour preserves the minute value', () => {
			// timestamp 1442 = day 1, hour 0, minute 2
			// add 1 hour → day 1, hour 1, minute 2 = 1440 + 60 + 2 = 1502
			const date = new EsotericDate(calendar, 1442)
			const result = date.step(hour, 1)
			expect(result.getTimestamp()).toBe(1502)
		})

		it('adding 1 hour at hour 23 overflows to next day, preserving minutes', () => {
			// timestamp = day 0, hour 23, minute 30 = 23*60 + 30 = 1410
			// add 1 hour → day 1, hour 0, minute 30 = 1440 + 30 = 1470
			const date = new EsotericDate(calendar, 1410)
			const result = date.step(hour, 1)
			expect(result.getTimestamp()).toBe(1470)
		})

		it('adding 1 day preserves hour and minute', () => {
			// timestamp = day 0, hour 5, minute 30 = 5*60 + 30 = 330
			// add 1 day → day 1, hour 5, minute 30 = 1440 + 330 = 1770
			const date = new EsotericDate(calendar, 330)
			const result = date.step(day, 1)
			expect(result.getTimestamp()).toBe(1770)
		})
	})

	describe('mixed children with child preservation', () => {
		// Day → [NormalHour x20, LongHour x4] where NormalHour has 60 Seconds, LongHour has 90 Seconds
		const second = mockCalendarUnit({
			id: 'second',
			name: 'Second',
			duration: 1,
			formatShorthand: 's',
			parents: [
				mockCalendarUnitParentRelation('normal-hour', 'second', 60),
				mockCalendarUnitParentRelation('long-hour', 'second', 90),
			],
		})
		const normalHour = mockCalendarUnit({
			id: 'normal-hour',
			name: 'NormalHour',
			displayName: 'Hour',
			duration: 60,
			formatShorthand: 'h',
			children: [mockCalendarUnitChildRelation('normal-hour', 'second', 60)],
			parents: [mockCalendarUnitParentRelation('day', 'normal-hour', 20)],
		})
		const longHour = mockCalendarUnit({
			id: 'long-hour',
			name: 'LongHour',
			displayName: 'Hour',
			duration: 90,
			formatShorthand: 'h',
			children: [mockCalendarUnitChildRelation('long-hour', 'second', 90)],
			parents: [mockCalendarUnitParentRelation('day', 'long-hour', 4)],
		})
		// Day = 20*60 + 4*90 = 1200 + 360 = 1560
		const day = mockCalendarUnit({
			id: 'day',
			name: 'Day',
			duration: 1560,
			formatShorthand: 'd',
			children: [
				mockCalendarUnitChildRelation('day', 'normal-hour', 20, { position: 0 }),
				mockCalendarUnitChildRelation('day', 'long-hour', 4, { position: 1 }),
			],
		})
		const units: CalendarUnit[] = [day, normalHour, longHour, second]
		const calendar = makeCalendar(units)

		it('step from NormalHour 19 to LongHour 0, preserving seconds', () => {
			// NormalHour 19, second 30 = 19*60 + 30 = 1170
			// +1 step → slot 20 (LongHour 0), second 30 preserved = 20*60 + 30 = 1230
			const date = new EsotericDate(calendar, 19 * 60 + 30)
			const result = date.step(normalHour, 1)
			expect(result.getTimestamp()).toBe(1200 + 30)
		})

		it('step from LongHour 0, second 30 to LongHour 1, second 30', () => {
			// LongHour 0, second 30 = 1200 + 30 = 1230
			// +1 → LongHour 1, second 30 = 1200 + 90 + 30 = 1320
			const date = new EsotericDate(calendar, 1230)
			const result = date.step(longHour, 1)
			expect(result.getTimestamp()).toBe(1320)
		})

		it('step from LongHour 3 (last) overflows to next day NormalHour 0, seconds preserved', () => {
			// LongHour 3, second 15 = 1200 + 3*90 + 15 = 1200 + 270 + 15 = 1485
			// +1 → overflows: next day, NormalHour 0, second 15 = 1560 + 15 = 1575
			const date = new EsotericDate(calendar, 1485)
			const result = date.step(longHour, 1)
			expect(result.getTimestamp()).toBe(1575)
		})
	})

	describe('losing children when moving to a unit without that child bucket', () => {
		// Construct: Day → [WorkHour x8, BreakSlot x1]
		// WorkHour has Minute x60, BreakSlot has NO children
		const minuteForWork = mockCalendarUnit({
			id: 'work-minute',
			name: 'WorkMinute',
			displayName: 'Minute',
			duration: 1,
			formatShorthand: 'i',
			parents: [mockCalendarUnitParentRelation('work-hour', 'work-minute', 60)],
		})
		const workHour = mockCalendarUnit({
			id: 'work-hour',
			name: 'WorkHour',
			displayName: 'Hour',
			duration: 60,
			formatShorthand: 'h',
			children: [mockCalendarUnitChildRelation('work-hour', 'work-minute', 60)],
			parents: [mockCalendarUnitParentRelation('day', 'work-hour', 8)],
		})
		const breakSlot = mockCalendarUnit({
			id: 'break-slot',
			name: 'BreakSlot',
			displayName: 'Hour',
			duration: 30,
			formatShorthand: 'b',
			parents: [mockCalendarUnitParentRelation('day', 'break-slot', 1)],
		})
		// Day = 8*60 + 1*30 = 510
		const day = mockCalendarUnit({
			id: 'day',
			name: 'Day',
			duration: 510,
			formatShorthand: 'd',
			children: [
				mockCalendarUnitChildRelation('day', 'work-hour', 8, { position: 0 }),
				mockCalendarUnitChildRelation('day', 'break-slot', 1, { position: 1 }),
			],
		})
		const units: CalendarUnit[] = [day, workHour, breakSlot, minuteForWork]
		const calendar = makeCalendar(units)

		it('stepping from WorkHour 7 (last) with minute 25 to BreakSlot 0 loses minutes', () => {
			// WorkHour 7, minute 25 = 7*60 + 25 = 445
			// +1 → slot 8 (BreakSlot 0, same Hour bucket). BreakSlot has no Minute children → minute lost
			// BreakSlot 0 = 8*60 = 480
			const date = new EsotericDate(calendar, 445)
			const result = date.step(workHour, 1)
			expect(result.getTimestamp()).toBe(480)
		})
	})

	describe('hidden parent (year cycle)', () => {
		// Hidden YearCycle → [NormalYear x2, LeapYear x1]
		// NormalYear = 365 days, LeapYear = 366 days
		// YearCycle = 2*365 + 366 = 1096
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
			parents: [mockCalendarUnitParentRelation('year-cycle', 'normal-year', 2)],
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
		})
		const units: CalendarUnit[] = [yearCycle, normalYear, leapYear, day]
		const calendar = makeCalendar(units)

		it('steps from NormalYear 0 day 100 to NormalYear 1 day 100', () => {
			// NormalYear 0, day 100 = 100
			// +1 year → NormalYear 1, day 100 = 365 + 100 = 465
			const date = new EsotericDate(calendar, 100)
			const result = date.step(normalYear, 1)
			expect(result.getTimestamp()).toBe(465)
		})

		it('steps from NormalYear 1 day 100 to LeapYear 0 day 100', () => {
			// NormalYear 1, day 100 = 365 + 100 = 465
			// +1 year → LeapYear 0, day 100 = 730 + 100 = 830
			const date = new EsotericDate(calendar, 465)
			const result = date.step(normalYear, 1)
			expect(result.getTimestamp()).toBe(830)
		})

		it('steps from LeapYear 0 day 100 wraps to next cycle NormalYear 0 day 100', () => {
			// LeapYear 0, day 100 = 730 + 100 = 830
			// +1 year → next cycle NormalYear 0, day 100 = 1096 + 100 = 1196
			const date = new EsotericDate(calendar, 830)
			const result = date.step(leapYear, 1)
			expect(result.getTimestamp()).toBe(1196)
		})

		it('preserves day value when stepping across year types', () => {
			// NormalYear 0, day 200 = 200
			// +2 years → LeapYear 0, day 200 = 730 + 200 = 930
			const date = new EsotericDate(calendar, 200)
			const result = date.step(normalYear, 2)
			expect(result.getTimestamp()).toBe(930)
		})

		it('handles stepping backward across cycle boundary', () => {
			// NormalYear in cycle 1, at day 50 = 1096 + 50 = 1146
			// -1 year → LeapYear 0, day 50 = 730 + 50 = 780
			const date = new EsotericDate(calendar, 1146)
			const result = date.step(normalYear, -1)
			expect(result.getTimestamp()).toBe(780)
		})

		it('steps +3 years (full cycle) from NormalYear 0', () => {
			// timestamp 50 = NormalYear 0, day 50
			// +3 years → 3 slots = 1 full cycle → next cycle NormalYear 0, day 50 = 1096 + 50 = 1146
			const date = new EsotericDate(calendar, 50)
			const result = date.step(normalYear, 3)
			expect(result.getTimestamp()).toBe(1146)
		})

		it('adds 1 day within a NormalYear', () => {
			// Day 100 in NormalYear 0: timestamp = 100. +1 day = 101.
			const date = new EsotericDate(calendar, 100)
			const result = date.step(day, 1)
			expect(result.getTimestamp()).toBe(101)
		})

		it('adding 1 day at end of NormalYear 0 overflows to NormalYear 1', () => {
			// NormalYear 0, day 364 = 364. +1 day → NormalYear 1, day 0 = 365.
			const date = new EsotericDate(calendar, 364)
			const result = date.step(day, 1)
			expect(result.getTimestamp()).toBe(365)
		})
	})

	describe('stepping year clamps day when month shrinks (Feb 29 → Feb 28)', () => {
		// Earth-like calendar with non-uniform months and Day → Hour → Minute hierarchy:
		// Regular year: Jan(31) Feb(28) Mar(31) = 90 days
		// Leap year:    Jan(31) Feb(29) Mar(31) = 91 days
		// YearCycle (Hidden): RegularYear x3, LeapYear x1
		// Each month has Day children, each Day has Hour x24, each Hour has Minute x60
		// Day duration = 24*60 = 1440
		const dayDur = 24 * 60
		const minute = mockCalendarUnit({
			id: 'minute',
			name: 'Minute',
			displayName: 'Minute',
			duration: 1,
			formatShorthand: 'i',
			formatMode: 'Numeric',
			parents: [mockCalendarUnitParentRelation('hour', 'minute', 60)],
		})
		const hour = mockCalendarUnit({
			id: 'hour',
			name: 'Hour',
			displayName: 'Hour',
			duration: 60,
			formatShorthand: 'h',
			formatMode: 'Numeric',
			children: [mockCalendarUnitChildRelation('hour', 'minute', 60)],
			parents: [mockCalendarUnitParentRelation('day', 'hour', 24)],
		})
		const day = mockCalendarUnit({
			id: 'day',
			name: 'Day',
			displayName: 'Day',
			duration: dayDur,
			formatShorthand: 'd',
			formatMode: 'NumericOneIndexed',
			children: [mockCalendarUnitChildRelation('day', 'hour', 24)],
			parents: [
				mockCalendarUnitParentRelation('28-day-month', 'day', 28),
				mockCalendarUnitParentRelation('29-day-month', 'day', 29),
				mockCalendarUnitParentRelation('31-day-month', 'day', 31),
			],
		})
		const day28Month = mockCalendarUnit({
			id: '28-day-month',
			name: '28-day month',
			displayName: 'Month',
			duration: 28 * dayDur,
			formatShorthand: 'M',
			formatMode: 'Name',
			children: [mockCalendarUnitChildRelation('28-day-month', 'day', 28)],
			parents: [mockCalendarUnitParentRelation('regular-year', '28-day-month', 1)],
		})
		const day29Month = mockCalendarUnit({
			id: '29-day-month',
			name: '29-day month',
			displayName: 'Month',
			duration: 29 * dayDur,
			formatShorthand: 'M',
			formatMode: 'Name',
			children: [mockCalendarUnitChildRelation('29-day-month', 'day', 29)],
			parents: [mockCalendarUnitParentRelation('leap-year', '29-day-month', 1)],
		})
		const day31Month = mockCalendarUnit({
			id: '31-day-month',
			name: '31-day month',
			displayName: 'Month',
			duration: 31 * dayDur,
			formatShorthand: 'M',
			formatMode: 'Name',
			children: [mockCalendarUnitChildRelation('31-day-month', 'day', 31)],
			parents: [
				mockCalendarUnitParentRelation('regular-year', '31-day-month', 2),
				mockCalendarUnitParentRelation('leap-year', '31-day-month', 2),
			],
		})
		const regDur = (31 + 28 + 31) * dayDur // 90 * 1440 = 129600
		const leapDur = (31 + 29 + 31) * dayDur // 91 * 1440 = 131040
		const regularYear = mockCalendarUnit({
			id: 'regular-year',
			name: 'Regular year',
			displayName: 'Year',
			duration: regDur,
			formatShorthand: 'Y',
			formatMode: 'NumericOneIndexed',
			children: [
				mockCalendarUnitChildRelation('regular-year', '31-day-month', 1, { position: 0 }), // Jan
				mockCalendarUnitChildRelation('regular-year', '28-day-month', 1, { position: 1 }), // Feb
				mockCalendarUnitChildRelation('regular-year', '31-day-month', 1, { position: 2 }), // Mar
			],
			parents: [mockCalendarUnitParentRelation('year-cycle', 'regular-year', 3)],
		})
		const leapYear = mockCalendarUnit({
			id: 'leap-year',
			name: 'Leap year',
			displayName: 'Year',
			duration: leapDur,
			formatShorthand: 'Y',
			formatMode: 'NumericOneIndexed',
			children: [
				mockCalendarUnitChildRelation('leap-year', '31-day-month', 1, { position: 0 }), // Jan
				mockCalendarUnitChildRelation('leap-year', '29-day-month', 1, { position: 1 }), // Feb
				mockCalendarUnitChildRelation('leap-year', '31-day-month', 1, { position: 2 }), // Mar
			],
			parents: [mockCalendarUnitParentRelation('year-cycle', 'leap-year', 1)],
		})
		const cycleDur = 3 * regDur + leapDur
		const yearCycle = mockCalendarUnit({
			id: 'year-cycle',
			name: 'YearCycle',
			duration: cycleDur,
			formatMode: 'Hidden',
			children: [
				mockCalendarUnitChildRelation('year-cycle', 'regular-year', 3, { position: 0 }),
				mockCalendarUnitChildRelation('year-cycle', 'leap-year', 1, { position: 1 }),
			],
		})
		const units: CalendarUnit[] = [
			yearCycle,
			regularYear,
			leapYear,
			day31Month,
			day29Month,
			day28Month,
			day,
			hour,
			minute,
		]
		const calendar = makeCalendar(units)

		it('stepping +1 year from leap Feb 29 22:35 clamps to regular Feb 28 22:35', () => {
			// LeapYear starts at 3 * regDur
			// Feb in LeapYear starts at leapYearStart + 31*dayDur (Jan)
			// Feb 29 (0-indexed 28), hour 22, minute 35
			const leapYearStart = 3 * regDur
			const febStart = leapYearStart + 31 * dayDur
			const ts = febStart + 28 * dayDur + 22 * 60 + 35
			const date = new EsotericDate(calendar, ts)

			const result = date.step(regularYear, 1)

			// Should land in next cycle's RegularYear 0, Feb 28 (clamped from 29), hour 22, minute 35
			// Next cycle starts at cycleDur
			// Feb in RegularYear 0 starts at cycleDur + 31*dayDur
			// Feb 28 = last day (0-indexed 27), hour 22, minute 35
			const expected = cycleDur + 31 * dayDur + 27 * dayDur + 22 * 60 + 35
			expect(result.getTimestamp()).toBe(expected)
		})

		it('stepping +1 year from leap Feb 15 10:00 preserves everything (no clamping needed)', () => {
			const leapYearStart = 3 * regDur
			const febStart = leapYearStart + 31 * dayDur
			const ts = febStart + 14 * dayDur + 10 * 60
			const date = new EsotericDate(calendar, ts)

			const result = date.step(regularYear, 1)

			// Next cycle RegularYear 0, Feb 15, hour 10
			const expected = cycleDur + 31 * dayDur + 14 * dayDur + 10 * 60
			expect(result.getTimestamp()).toBe(expected)
		})
	})

	describe('negative timestamps', () => {
		const minute = mockCalendarUnit({
			id: 'minute',
			name: 'Minute',
			duration: 1,
			formatShorthand: 'i',
			parents: [mockCalendarUnitParentRelation('hour', 'minute', 60)],
		})
		const hour = mockCalendarUnit({
			id: 'hour',
			name: 'Hour',
			duration: 60,
			formatShorthand: 'h',
			children: [mockCalendarUnitChildRelation('hour', 'minute', 60)],
		})
		const units: CalendarUnit[] = [hour, minute]
		const calendar = makeCalendar(units)

		it('adds 1 minute at timestamp -1 (hour -1 minute 59 → hour 0 minute 0)', () => {
			// -1 = hour -1, minute 59. +1 → hour 0, minute 0 = 0
			const date = new EsotericDate(calendar, -1)
			const result = date.step(minute, 1)
			expect(result.getTimestamp()).toBe(0)
		})

		it('subtracts 1 minute from timestamp 0 → -1', () => {
			const date = new EsotericDate(calendar, 0)
			const result = date.step(minute, -1)
			expect(result.getTimestamp()).toBe(-1)
		})
	})

	describe('adding large amounts', () => {
		const minute = mockCalendarUnit({
			id: 'minute',
			name: 'Minute',
			duration: 1,
			formatShorthand: 'i',
			parents: [mockCalendarUnitParentRelation('hour', 'minute', 60)],
		})
		const hour = mockCalendarUnit({
			id: 'hour',
			name: 'Hour',
			duration: 60,
			formatShorthand: 'h',
			children: [mockCalendarUnitChildRelation('hour', 'minute', 60)],
		})
		const units: CalendarUnit[] = [hour, minute]
		const calendar = makeCalendar(units)

		it('adds 120 minutes (2 hours worth)', () => {
			const date = new EsotericDate(calendar, 0)
			const result = date.step(minute, 120)
			expect(result.getTimestamp()).toBe(120)
		})

		it('adds 1000 minutes from timestamp 30', () => {
			const date = new EsotericDate(calendar, 30)
			const result = date.step(minute, 1000)
			expect(result.getTimestamp()).toBe(1030)
		})
	})

	describe('format sanity checks (Day → Hour → Minute → Second)', () => {
		// Day = 86400, Hour = 3600, Minute = 60, Second = 1
		// Day has 24 Hours, Hour has 60 Minutes, Minute has 60 Seconds
		const second = mockCalendarUnit({
			id: 'second',
			name: 'Second',
			duration: 1,
			formatShorthand: 's',
			formatMode: 'Numeric',
			parents: [mockCalendarUnitParentRelation('minute', 'second', 60)],
		})
		const minute = mockCalendarUnit({
			id: 'minute',
			name: 'Minute',
			duration: 60,
			formatShorthand: 'i',
			formatMode: 'Numeric',
			children: [mockCalendarUnitChildRelation('minute', 'second', 60)],
			parents: [mockCalendarUnitParentRelation('hour', 'minute', 60)],
		})
		const hour = mockCalendarUnit({
			id: 'hour',
			name: 'Hour',
			duration: 3600,
			formatShorthand: 'h',
			formatMode: 'Numeric',
			children: [mockCalendarUnitChildRelation('hour', 'minute', 60)],
			parents: [mockCalendarUnitParentRelation('day', 'hour', 24)],
		})
		const day = mockCalendarUnit({
			id: 'day',
			name: 'Day',
			duration: 86400,
			formatShorthand: 'd',
			formatMode: 'Numeric',
			children: [mockCalendarUnitChildRelation('day', 'hour', 24)],
		})
		const units: CalendarUnit[] = [day, hour, minute, second]
		const calendar = makeCalendar(units)
		const fmt = 'dd:hh:ii:ss'

		it('timestamp 0 formats as 0:00:00:00', () => {
			const date = new EsotericDate(calendar, 0)
			expect(date.format(fmt)).toBe('00:00:00:00')
		})

		it('add 100 minutes from 01:00:15:22 → 01:01:55:22', () => {
			// 01:00:15:22 = 1*86400 + 0*3600 + 15*60 + 22 = 86400 + 922 = 87322
			const date = new EsotericDate(calendar, 87322)
			expect(date.format(fmt)).toBe('01:00:15:22')

			const result = date.step(minute, 100)
			// 100 minutes = 1 hour 40 minutes
			// 00:15 + 100 min = 01:55
			expect(result.format(fmt)).toBe('01:01:55:22')
		})

		it('add 100 minutes from 01:23:45:30 → 02:01:25:30 (overflow hour)', () => {
			// 01:23:45:30 = 86400 + 23*3600 + 45*60 + 30 = 86400 + 82800 + 2700 + 30 = 171930
			const date = new EsotericDate(calendar, 171930)
			expect(date.format(fmt)).toBe('01:23:45:30')

			const result = date.step(minute, 100)
			// 23:45 + 100 min = 25:25 → overflow: +1 day, 01:25
			// day 2, 01:25:30
			expect(result.format(fmt)).toBe('02:01:25:30')
		})

		it('add 3 hours from 00:22:10:05 → 01:01:10:05 (overflow day)', () => {
			// 00:22:10:05 = 22*3600 + 10*60 + 5 = 79200 + 600 + 5 = 79805
			const date = new EsotericDate(calendar, 79805)
			expect(date.format(fmt)).toBe('00:22:10:05')

			const result = date.step(hour, 3)
			// 22 + 3 = 25 hours → overflow: day 1, hour 1
			// preserve minute 10, second 05
			expect(result.format(fmt)).toBe('01:01:10:05')
		})

		it('add 1 day preserves everything below', () => {
			// 02:15:30:45 = 2*86400 + 15*3600 + 30*60 + 45 = 172800 + 54000 + 1800 + 45 = 228645
			const date = new EsotericDate(calendar, 228645)
			expect(date.format(fmt)).toBe('02:15:30:45')

			const result = date.step(day, 1)
			expect(result.format(fmt)).toBe('03:15:30:45')
		})

		it('subtract 30 minutes from 00:00:20:00 → -01:23:50:00 (negative day)', () => {
			// 00:00:20:00 = 20*60 = 1200
			const date = new EsotericDate(calendar, 1200)
			expect(date.format(fmt)).toBe('00:00:20:00')

			const result = date.step(minute, -30)
			// 20 - 30 = -10 minutes → previous hour: 23:50, previous day: -1
			expect(result.format(fmt)).toBe('-01:23:50:00')
		})

		it('add 1440 minutes (exactly 24 hours) advances exactly 1 day', () => {
			// 00:05:30:15 = 5*3600 + 30*60 + 15 = 18000 + 1800 + 15 = 19815
			const date = new EsotericDate(calendar, 19815)
			expect(date.format(fmt)).toBe('00:05:30:15')

			const result = date.step(minute, 1440)
			expect(result.format(fmt)).toBe('01:05:30:15')
		})
	})

	describe('format sanity checks with non-uniform hours', () => {
		// Day → [NormalHour x20 (dur=3600), LongHour x4 (dur=5400)]
		// Both share displayName "Hour", both contain Minute x(their duration/60) and Second
		// Day = 20*3600 + 4*5400 = 72000 + 21600 = 93600
		const second = mockCalendarUnit({
			id: 'second',
			name: 'Second',
			duration: 1,
			formatShorthand: 's',
			formatMode: 'Numeric',
			parents: [
				mockCalendarUnitParentRelation('normal-minute', 'second', 60),
				mockCalendarUnitParentRelation('long-minute', 'second', 60),
			],
		})
		const normalMinute = mockCalendarUnit({
			id: 'normal-minute',
			name: 'NormalMinute',
			displayName: 'Minute',
			duration: 60,
			formatShorthand: 'i',
			formatMode: 'Numeric',
			children: [mockCalendarUnitChildRelation('normal-minute', 'second', 60)],
			parents: [mockCalendarUnitParentRelation('normal-hour', 'normal-minute', 60)],
		})
		const longMinute = mockCalendarUnit({
			id: 'long-minute',
			name: 'LongMinute',
			displayName: 'Minute',
			duration: 60,
			formatShorthand: 'i',
			formatMode: 'Numeric',
			children: [mockCalendarUnitChildRelation('long-minute', 'second', 60)],
			parents: [mockCalendarUnitParentRelation('long-hour', 'long-minute', 90)],
		})
		const normalHour = mockCalendarUnit({
			id: 'normal-hour',
			name: 'NormalHour',
			displayName: 'Hour',
			duration: 3600,
			formatShorthand: 'h',
			formatMode: 'Numeric',
			children: [mockCalendarUnitChildRelation('normal-hour', 'normal-minute', 60)],
			parents: [mockCalendarUnitParentRelation('day', 'normal-hour', 20)],
		})
		const longHour = mockCalendarUnit({
			id: 'long-hour',
			name: 'LongHour',
			displayName: 'Hour',
			duration: 5400,
			formatShorthand: 'h',
			formatMode: 'Numeric',
			children: [mockCalendarUnitChildRelation('long-hour', 'long-minute', 90)],
			parents: [mockCalendarUnitParentRelation('day', 'long-hour', 4)],
		})
		// Day = 20*3600 + 4*5400 = 72000 + 21600 = 93600
		const day = mockCalendarUnit({
			id: 'day',
			name: 'Day',
			duration: 93600,
			formatShorthand: 'd',
			formatMode: 'Numeric',
			children: [
				mockCalendarUnitChildRelation('day', 'normal-hour', 20, { position: 0 }),
				mockCalendarUnitChildRelation('day', 'long-hour', 4, { position: 1 }),
			],
		})
		const units: CalendarUnit[] = [day, normalHour, longHour, normalMinute, longMinute, second]
		const calendar = makeCalendar(units)
		const fmt = 'dd:hh:ii:ss'

		it('NormalHour 5, Minute 30, Second 15 formats correctly', () => {
			// 5*3600 + 30*60 + 15 = 18000 + 1800 + 15 = 19815
			const date = new EsotericDate(calendar, 19815)
			expect(date.format(fmt)).toBe('00:05:30:15')
		})

		it('add 1 hour from NormalHour 19 to LongHour 0, preserves minute and second', () => {
			// NormalHour 19, Minute 30, Second 15 = 19*3600 + 30*60 + 15 = 68400 + 1800 + 15 = 70215
			const date = new EsotericDate(calendar, 70215)
			expect(date.format(fmt)).toBe('00:19:30:15')

			const result = date.step(normalHour, 1)
			// → LongHour 0 (bucket Hour 20), Minute 30, Second 15
			// = 20*3600 + 30*60 + 15 = 72000 + 1800 + 15 = 73815
			expect(result.format(fmt)).toBe('00:20:30:15')
			expect(result.getTimestamp()).toBe(73815)
		})

		it('add 2 hours from NormalHour 19 → LongHour 1, preserves minute and second', () => {
			// NormalHour 19, Minute 10, Second 5 = 19*3600 + 10*60 + 5 = 68400 + 600 + 5 = 69005
			const date = new EsotericDate(calendar, 69005)
			expect(date.format(fmt)).toBe('00:19:10:05')

			const result = date.step(normalHour, 2)
			// step +2: slot 19 → slot 20 (LongHour 0) → slot 21 (LongHour 1)
			// LongHour 1, Minute 10, Second 5 = 72000 + 5400 + 10*60 + 5 = 78005
			expect(result.format(fmt)).toBe('00:21:10:05')
			expect(result.getTimestamp()).toBe(78005)
		})

		it('add 5 hours from NormalHour 19 crosses into LongHour and wraps to next day', () => {
			// NormalHour 19, Minute 0, Second 0 = 19*3600 = 68400
			const date = new EsotericDate(calendar, 68400)
			expect(date.format(fmt)).toBe('00:19:00:00')

			const result = date.step(normalHour, 5)
			// step +5: slots 19→20→21→22→23→0 (next day, NormalHour 0)
			// 24 total slots, index 19+5=24, overflow 1, wrapped to slot 0
			// = 93600 + 0 = 93600
			expect(result.format(fmt)).toBe('01:00:00:00')
			expect(result.getTimestamp()).toBe(93600)
		})
	})
})
