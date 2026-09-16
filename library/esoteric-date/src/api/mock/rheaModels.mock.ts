import { WorldCalendar, WorldCalendarPreview } from '@/api/types/worldTypes'

export function mockCalendar(overrides: Partial<WorldCalendar>): WorldCalendar {
	return {
		units: [],
		presentations: [],
		id: crypto.randomUUID(),
		updatedAt: '2024-01-01T00:00:00.000Z',
		name: 'Test Calendar',
		description: '',
		position: 0,
		originTime: 0,
		seasons: [],
		...overrides,
	}
}

export const mockCalendarUnit = (
	overrides: Omit<Partial<WorldCalendarPreview['units'][number]>, 'duration'> & {
		id: string
		name: string
		duration: number
	},
): WorldCalendarPreview['units'][number] => ({
	id: overrides.id,
	position: overrides.position ?? 0,
	name: overrides.name,
	displayName: overrides.displayName ?? overrides.name,
	displayNameShort: overrides.displayNameShort ?? overrides.name.substring(0, 1).toUpperCase(),
	displayNamePlural: overrides.displayNamePlural ?? overrides.name + 's',
	formatMode: overrides.formatMode ?? 'Numeric',
	formatShorthand: overrides.formatShorthand ?? null,
	negativeFormat: overrides.negativeFormat ?? 'MinusSign',
	duration: String(overrides.duration ?? 1),
	treeDepth: overrides.treeDepth ?? 0,
	children: overrides.children ?? [],
	parents: overrides.parents ?? [],
})

export const mockCalendarUnitChildRelation = (
	parentUnitId: string,
	childUnitId: string,
	repeats: number,
	overrides: Partial<WorldCalendarPreview['units'][number]['children'][number]> = {},
): WorldCalendarPreview['units'][number]['children'][number] => ({
	id: overrides.id ?? `${parentUnitId}-${childUnitId}`,
	calendarId: overrides.calendarId ?? 'calendar-1111',
	position: overrides.position ?? 0,
	label: overrides.label ?? null,
	repeats,
	parentUnitId,
	childUnitId,
})

export const mockCalendarUnitParentRelation = (
	parentUnitId: string,
	childUnitId: string,
	repeats: number,
	overrides: Partial<WorldCalendarPreview['units'][number]['parents'][number]> = {},
): WorldCalendarPreview['units'][number]['parents'][number] => ({
	id: overrides.id ?? `${parentUnitId}-${childUnitId}`,
	calendarId: overrides.calendarId ?? 'calendar-1111',
	position: overrides.position ?? 0,
	label: overrides.label ?? null,
	repeats,
	parentUnitId,
	childUnitId,
})

export const EARTH = {
	MINUTE: 1,
	HOUR: 60,
	DAY: 24 * 60,
	get REGULAR_YEAR() {
		return 365 * this.DAY
	},
	get LEAP_YEAR() {
		return 366 * this.DAY
	},
} as const

const EARTH_MONTHS: ReadonlyArray<readonly [string, number]> = [
	['January', 31],
	['February', 28],
	['March', 31],
	['April', 30],
	['May', 31],
	['June', 30],
	['July', 31],
	['August', 31],
	['September', 30],
	['October', 31],
	['November', 30],
	['December', 31],
]

const earthMonthUnitId = (days: number) => `${days}-day-month`

function earthYearChildren(parentId: string, leap: boolean) {
	return EARTH_MONTHS.map(([name, days], i) => {
		const monthDays = leap && name === 'February' ? 29 : days
		return mockCalendarUnitChildRelation(parentId, earthMonthUnitId(monthDays), 1, {
			id: `${parentId}-m${i}`,
			position: i,
			label: name,
		})
	})
}

export function mockEarthCalendarUnits(): WorldCalendar['units'] {
	const { DAY, HOUR, MINUTE, REGULAR_YEAR, LEAP_YEAR } = EARTH
	const FOUR_YEAR = 3 * REGULAR_YEAR + LEAP_YEAR
	const HUNDRED_YEAR = 24 * FOUR_YEAR + 4 * REGULAR_YEAR
	const FOUR_HUNDRED_YEAR = 3 * HUNDRED_YEAR + 25 * FOUR_YEAR

	const monthLengths = [28, 29, 30, 31]
	// Prisma serves one relation row as both the parent's `children` and the child's
	// `parents`, so the month's parent relations must be the very same objects.
	const regularYearChildren = earthYearChildren('regular-year', false)
	const leapYearChildren = earthYearChildren('leap-year', true)
	const monthUnits = monthLengths.map((days) =>
		mockCalendarUnit({
			id: earthMonthUnitId(days),
			name: `${days}-day month`,
			displayName: 'month',
			displayNameShort: 'mon',
			duration: days * DAY,
			formatShorthand: 'M',
			formatMode: 'Name',
			position: 3,
			children: [mockCalendarUnitChildRelation(earthMonthUnitId(days), 'day', days)],
			parents: [...regularYearChildren, ...leapYearChildren].filter(
				(relation) => relation.childUnitId === earthMonthUnitId(days),
			),
		}),
	)

	return [
		mockCalendarUnit({
			id: 'minute',
			name: 'minute',
			displayName: 'minute',
			displayNameShort: 'min',
			duration: MINUTE,
			formatShorthand: 'm',
			formatMode: 'Numeric',
			position: 0,
			children: [],
			parents: [mockCalendarUnitParentRelation('hour', 'minute', 60)],
		}),
		mockCalendarUnit({
			id: 'hour',
			name: 'hour',
			displayName: 'hour',
			displayNameShort: 'hr',
			duration: HOUR,
			formatShorthand: 'h',
			formatMode: 'Numeric',
			position: 1,
			children: [mockCalendarUnitChildRelation('hour', 'minute', 60)],
			parents: [mockCalendarUnitParentRelation('day', 'hour', 24)],
		}),
		mockCalendarUnit({
			id: 'day',
			name: 'day',
			displayName: 'day',
			displayNameShort: 'd',
			duration: DAY,
			formatShorthand: 'd',
			formatMode: 'NumericOneIndexed',
			position: 2,
			children: [mockCalendarUnitChildRelation('day', 'hour', 24)],
			parents: monthLengths.map((days) =>
				mockCalendarUnitParentRelation(earthMonthUnitId(days), 'day', days),
			),
		}),
		...monthUnits,
		mockCalendarUnit({
			id: 'regular-year',
			name: 'Regular year',
			displayName: 'year',
			displayNameShort: 'yr',
			duration: REGULAR_YEAR,
			formatShorthand: 'Y',
			formatMode: 'NumericOneIndexed',
			position: 4,
			children: regularYearChildren,
			parents: [
				mockCalendarUnitParentRelation('four-year-cycle', 'regular-year', 3),
				mockCalendarUnitParentRelation('hundred-year-cycle', 'regular-year', 4),
			],
		}),
		mockCalendarUnit({
			id: 'leap-year',
			name: 'Leap year',
			displayName: 'year',
			displayNameShort: 'yr',
			duration: LEAP_YEAR,
			formatShorthand: 'Y',
			formatMode: 'NumericOneIndexed',
			position: 4,
			children: leapYearChildren,
			parents: [mockCalendarUnitParentRelation('four-year-cycle', 'leap-year', 1)],
		}),
		mockCalendarUnit({
			id: 'four-year-cycle',
			name: '4-year cycle',
			displayName: '4-year cycle',
			duration: FOUR_YEAR,
			formatShorthand: null,
			formatMode: 'Hidden',
			position: 5,
			children: [
				mockCalendarUnitChildRelation('four-year-cycle', 'regular-year', 3, { position: 0 }),
				mockCalendarUnitChildRelation('four-year-cycle', 'leap-year', 1, { position: 1 }),
			],
			parents: [
				mockCalendarUnitParentRelation('hundred-year-cycle', 'four-year-cycle', 24),
				mockCalendarUnitParentRelation('four-hundred-year-cycle', 'four-year-cycle', 25),
			],
		}),
		mockCalendarUnit({
			id: 'hundred-year-cycle',
			name: '100-year cycle',
			displayName: '100-year cycle',
			duration: HUNDRED_YEAR,
			formatShorthand: null,
			formatMode: 'Hidden',
			position: 6,
			children: [
				mockCalendarUnitChildRelation('hundred-year-cycle', 'four-year-cycle', 24, { position: 0 }),
				mockCalendarUnitChildRelation('hundred-year-cycle', 'regular-year', 4, { position: 1 }),
			],
			parents: [mockCalendarUnitParentRelation('four-hundred-year-cycle', 'hundred-year-cycle', 3)],
		}),
		mockCalendarUnit({
			id: 'four-hundred-year-cycle',
			name: '400-year cycle',
			displayName: '400-year cycle',
			duration: FOUR_HUNDRED_YEAR,
			formatShorthand: null,
			formatMode: 'Hidden',
			position: 7,
			children: [
				mockCalendarUnitChildRelation('four-hundred-year-cycle', 'hundred-year-cycle', 3, { position: 0 }),
				mockCalendarUnitChildRelation('four-hundred-year-cycle', 'four-year-cycle', 25, { position: 1 }),
			],
			parents: [],
		}),
	]
}

export function mockEarthCalendar(overrides: Partial<WorldCalendar> = {}): WorldCalendar {
	return mockCalendar({
		dateFormat: 'hh:mm MM DD, YYYY',
		units: mockEarthCalendarUnits(),
		...overrides,
	})
}
