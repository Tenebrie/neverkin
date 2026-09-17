import { describe, expect, it } from 'vitest'

import { replaceOnce } from './replaceOnce.js'

describe('replaceOnce', () => {
	it('replaces a single occurrence', () => {
		expect(replaceOnce({ content: '<p>A grey wizard.</p>', oldString: 'grey', newString: 'white' })).toBe(
			'<p>A white wizard.</p>',
		)
	})

	it('treats replacement patterns literally', () => {
		expect(replaceOnce({ content: 'cost: 5', oldString: '5', newString: "$& $' $1" })).toBe("cost: $& $' $1")
	})

	it('throws when the old string is missing', () => {
		expect(() => replaceOnce({ content: 'abc', oldString: 'x', newString: 'y' })).toThrow('not found')
	})

	it('throws when the old string is ambiguous', () => {
		expect(() =>
			replaceOnce({ content: 'a wizard, a wizard', oldString: 'a wizard', newString: 'x' }),
		).toThrow('appears 2 times')
	})
})
