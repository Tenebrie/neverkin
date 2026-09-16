import { EsotericDate, mockEarthCalendar } from '@neverkin/esoteric-date'
import { describe, expect, it } from '@rstest/core'

import { worldInitialState } from '@/app/views/world/WorldSlice'
import { renderHookWithProviders } from '@/test-utils/renderWithProviders'

import { useTimeSelector } from './useTimeSelector'

describe('useTimeSelector', () => {
	const calendar = mockEarthCalendar()
	const at = (formatted: string) => new EsotericDate(calendar, 0).fromFormatted(formatted).getTimestamp()

	const START = at('12:30 March 09, 2026')

	const { result: hook } = renderHookWithProviders(() => useTimeSelector({ rawTime: START }), {
		preloadedState: {
			world: { ...worldInitialState, calendars: [calendar], selectedTime: START },
		},
	})

	const apply = (selector: string) =>
		new EsotericDate(calendar, hook.current.applySelector(selector).timestamp).format()

	it('returns the current time for an empty selector', () => {
		expect(apply('')).toBe('12:30 March 09, 2026')
	})

	it('ignores a selector that matches nothing', () => {
		expect(apply('sometime next tuesday')).toBe('12:30 March 09, 2026')
	})

	describe('setting a unit', () => {
		it('sets the named unit and leaves every other unit alone', () => {
			expect(apply('m15')).toBe('12:15 March 09, 2026')
			expect(apply('h6')).toBe('06:30 March 09, 2026')
			expect(apply('d3')).toBe('12:30 March 03, 2026')
			expect(apply('y2000')).toBe('12:30 March 09, 2000')
		})

		it('accepts the full and short unit names alongside the shorthand', () => {
			expect(apply('year2000')).toBe(apply('y2000'))
			expect(apply('yr2000')).toBe(apply('y2000'))
			expect(apply('min15')).toBe(apply('m15'))
		})

		it('tells minutes and months apart by case', () => {
			expect(apply('m4')).toBe('12:04 March 09, 2026')
			expect(apply('M4')).toBe('12:30 May 09, 2026')
		})

		it('counts months from zero, because Gregorian months format by name', () => {
			expect(apply('M0')).toBe('12:30 January 09, 2026')
			expect(apply('M3')).toBe('12:30 April 09, 2026')
		})

		it('selects a period by the label the calendar gives it', () => {
			expect(apply('december')).toBe('12:30 December 09, 2026')
			expect(apply('JANUARY')).toBe('12:30 January 09, 2026')
		})
	})

	describe('stepping by an amount', () => {
		it('steps forward', () => {
			expect(apply('15m')).toBe('12:45 March 09, 2026')
			expect(apply('6h')).toBe('18:30 March 09, 2026')
			expect(apply('3d')).toBe('12:30 March 12, 2026')
			expect(apply('3M')).toBe('12:30 June 09, 2026')
			expect(apply('1y')).toBe('12:30 March 09, 2027')
		})

		it('steps back on a negative amount', () => {
			expect(apply('-10y')).toBe('12:30 March 09, 2016')
			expect(apply('-1d')).toBe('12:30 March 08, 2026')
		})
	})

	describe('exact selectors', () => {
		it('truncates everything below the named unit', () => {
			expect(apply('h6!')).toBe('06:00 March 09, 2026')
			expect(apply('d1!')).toBe('00:00 March 01, 2026')
			expect(apply('y2000!')).toBe('00:00 January 01, 2000')
			expect(apply('december!')).toBe('00:00 December 01, 2026')
		})
	})

	describe('combining selectors', () => {
		it('applies every space-separated selector in order', () => {
			expect(apply('y2000 M3 d1')).toBe('12:30 April 01, 2000')
			expect(apply('3d 15m')).toBe('12:45 March 12, 2026')
			expect(apply('y1999 december!')).toBe('00:00 December 01, 1999')
		})

		it('mixes absolute and relative selectors', () => {
			expect(apply('y2000 -1d')).toBe('12:30 March 08, 2000')
		})
	})

	describe('matching the date format', () => {
		it('accepts a fully formatted date', () => {
			expect(apply('14:00 April 04, 2030')).toBe('14:00 April 04, 2030')
		})

		it('accepts the leading fields on their own', () => {
			expect(apply('14:23')).toBe('14:23 March 09, 2026')
		})

		it('accepts the trailing fields on their own', () => {
			expect(apply('April 04, 2030')).toBe('12:30 April 04, 2030')
		})

		it('accepts any contiguous run of fields', () => {
			expect(apply('04, 2030')).toBe('12:30 March 04, 2030')
		})

		it('ignores a lone field, which every numeric field would match', () => {
			expect(apply('2030')).toBe('12:30 March 09, 2026')
		})

		it('does not ask for the zero padding the timeline writes out', () => {
			expect(apply('4:23')).toBe('04:23 March 09, 2026')
			expect(apply('14:00 April 4, 2030')).toBe('14:00 April 04, 2030')
			expect(apply('04, 150')).toBe('12:30 March 04, 0150')
		})

		it('reads a date whatever case it is typed in', () => {
			expect(apply('april 02, 2020')).toBe('12:30 April 02, 2020')
			expect(apply('00:00 DECEMBER 25, 2026')).toBe('00:00 December 25, 2026')
		})

		it("does not hold the typist to the timeline's own spacing", () => {
			expect(apply('april 2,2020')).toBe('12:30 April 02, 2020')
			expect(apply('14:00  April 04 , 2030')).toBe('14:00 April 04, 2030')
		})

		it('leaves ordinary selectors to the unit parser', () => {
			expect(apply('3d 15m')).toBe('12:45 March 12, 2026')
			expect(apply('march')).toBe('12:30 March 09, 2026')
		})
	})
})
