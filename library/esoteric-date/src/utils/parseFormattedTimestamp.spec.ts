import { describe, expect, it } from 'vitest'

import {
	mockCalendar,
	mockCalendarUnit,
	mockCalendarUnitChildRelation,
	mockCalendarUnitParentRelation,
	mockEarthCalendar,
} from '@/api/mock/rheaModels.mock'

import { parseFormattedTimestamp } from './parseFormattedTimestamp'

describe('parseFormattedTimestamp', () => {
	const calendar = mockEarthCalendar()
	const dateFormat = calendar.dateFormat!

	const parse = (formatted: string, allowPartial = false) =>
		Object.fromEntries(
			[...parseFormattedTimestamp({ allUnits: calendar.units, formatted, dateFormat, allowPartial })].map(
				([unitId, entry]) => [unitId, entry.value],
			),
		)

	it('reads every field of a fully formatted date', () => {
		expect(parse('14:00 April 04, 2030')).toEqual({
			hour: 14,
			minute: 0,
			'30-day-month': 3,
			day: 3,
			'regular-year': 2029,
		})
	})

	describe('partial matches', () => {
		it('reads a leading run of fields', () => {
			expect(parse('14:23', true)).toEqual({ hour: 14, minute: 23 })
		})

		it('reads a trailing run of fields', () => {
			expect(parse('April 04, 2030', true)).toEqual({
				'30-day-month': 3,
				day: 3,
				'regular-year': 2029,
			})
		})

		it('reads a run from the middle of the format', () => {
			expect(parse('04, 2030', true)).toEqual({ day: 3, 'regular-year': 2029 })
		})

		it('rejects a lone field, which every numeric field in the format would match', () => {
			expect(() => parse('2030', true)).toThrow()
		})

		it('rejects a run that skips over a field', () => {
			expect(() => parse('14:23 2030', true)).toThrow()
		})

		it('reads every field of a format wrapped in literal text, without the wrapping', () => {
			const decorated = mockEarthCalendar({ dateFormat: 'hh:mm MM DD, YYYY (AD)' })
			const parsed = parseFormattedTimestamp({
				allUnits: decorated.units,
				formatted: '14:00 April 04, 2030',
				dateFormat: decorated.dateFormat!,
				allowPartial: true,
			})
			expect(parsed.get('regular-year')?.value).toBe(2029)
			expect(parsed.get('hour')?.value).toBe(14)
		})
	})

	describe('field width', () => {
		it('does not require the padding the format writes out', () => {
			expect(parse('00:00 April 4, 150')).toEqual({
				hour: 0,
				minute: 0,
				'30-day-month': 3,
				day: 3,
				'regular-year': 149,
			})
			expect(parse('4:23', true)).toEqual({ hour: 4, minute: 23 })
			expect(parse('04, 150', true)).toEqual({ day: 3, 'regular-year': 149 })
		})

		it('still requires it where two fields touch, which is all that marks the boundary', () => {
			const packed = mockCalendar({
				dateFormat: 'mmdd',
				units: [
					mockCalendarUnit({
						id: 'month',
						name: 'Month',
						duration: 30,
						formatShorthand: 'm',
						formatMode: 'NumericOneIndexed',
						children: [mockCalendarUnitChildRelation('month', 'day', 30)],
					}),
					mockCalendarUnit({
						id: 'day',
						name: 'Day',
						duration: 1,
						formatShorthand: 'd',
						formatMode: 'NumericOneIndexed',
						parents: [mockCalendarUnitParentRelation('month', 'day', 30)],
					}),
				],
			})
			const parsePacked = (formatted: string) =>
				parseFormattedTimestamp({ allUnits: packed.units, formatted, dateFormat: 'mmdd' })

			expect([...parsePacked('0115')].map(([id, entry]) => [id, entry.value])).toEqual([
				['month', 0],
				['day', 14],
			])
			expect(() => parsePacked('115')).toThrow()
		})
	})

	describe('spacing', () => {
		const canonical = parse('00:00 April 04, 2030')

		it('does not hold the input to the format’s own spacing', () => {
			expect(parse('00:00  April 04,2030')).toEqual(canonical)
			expect(parse('00:00 April 04 , 2030')).toEqual(canonical)
			expect(parse('0 : 0 April 4,2030')).toEqual(canonical)
		})

		it('still requires whitespace that is the only thing separating two fields', () => {
			expect(() => parse('00:00April 04, 2030')).toThrow()
		})

		it('still requires a separator that is not whitespace', () => {
			expect(() => parse('00:00 April 04 2030')).toThrow()
		})
	})

	it('reads a date whatever case it is written in', () => {
		expect(parse('00:00 april 04, 2030')).toEqual(parse('00:00 April 04, 2030'))
		expect(parse('APRIL 04, 2030', true)).toEqual(parse('April 04, 2030', true))
	})

	it('rejects a partial match unless it is asked for', () => {
		expect(() => parse('14:23')).toThrow()
	})

	it('rejects a string that is not a date at all', () => {
		expect(() => parse('not a date', true)).toThrow()
	})
})
