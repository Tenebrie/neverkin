import { describe, expect, it } from 'vitest'

import { mockNumericCalendar } from '../test-utils/mockCalendar.js'
import { resolveTimestamp } from './resolveTimestamp.js'

// The numeric test calendar parses a plain number back into a timestamp.
const worldData = { calendars: [mockNumericCalendar()] } as unknown as Parameters<typeof resolveTimestamp>[1]

describe('resolveTimestamp', () => {
	it('returns undefined when no timestamp is given', () => {
		expect(resolveTimestamp(undefined, worldData)).toBeUndefined()
	})

	it('parses a valid timestamp string into a numeric timestamp', () => {
		expect(resolveTimestamp('1440', worldData)).toBe(1440)
	})

	it('parses the origin (zero) timestamp', () => {
		expect(resolveTimestamp('0', worldData)).toBe(0)
	})

	it('parses negative timestamps', () => {
		expect(resolveTimestamp('-5', worldData)).toBe(-5)
	})

	it('throws a helpful error when the timestamp cannot be parsed', () => {
		expect(() => resolveTimestamp('not-a-real-date', worldData)).toThrow('Unable to parse timestamp')
	})

	it('includes the expected format and available units in the error', () => {
		try {
			resolveTimestamp('not-a-real-date', worldData)
			expect.unreachable('resolveTimestamp should have thrown')
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			expect(message).toContain('Expected format: d')
			expect(message).toContain('Available units:')
			expect(message).toContain('d: Day')
		}
	})
})
