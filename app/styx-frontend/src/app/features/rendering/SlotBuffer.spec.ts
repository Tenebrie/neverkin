import { describe, expect, it } from '@rstest/core'

import { SlotBuffer } from './SlotBuffer'

describe('SlotBuffer', () => {
	it('packs records back to back in write order', () => {
		const buffer = new SlotBuffer<string>(2)
		buffer.write('a', [1, 2])
		buffer.write('b', [3, 4])

		const { data, offset, length } = buffer.takeChanges()

		expect(buffer.count).toEqual(2)
		expect(Array.from(data.subarray(offset, offset + length))).toEqual([1, 2, 3, 4])
	})

	it('overwrites an existing record in place', () => {
		const buffer = new SlotBuffer<string>(2)
		buffer.write('a', [1, 2])
		buffer.write('b', [3, 4])
		buffer.takeChanges()

		buffer.write('a', [5, 6])
		const { data, offset, length } = buffer.takeChanges()

		expect(buffer.count).toEqual(2)
		expect({ offset, length }).toEqual({ offset: 0, length: 2 })
		expect(Array.from(data.subarray(0, 4))).toEqual([5, 6, 3, 4])
	})

	it('reports only the range written since the previous call', () => {
		const buffer = new SlotBuffer<string>(2)
		buffer.write('a', [1, 2])
		buffer.write('b', [3, 4])
		buffer.write('c', [5, 6])
		buffer.takeChanges()

		buffer.write('b', [7, 8])

		expect(buffer.takeChanges()).toMatchObject({ offset: 2, length: 2 })
		expect(buffer.takeChanges()).toMatchObject({ offset: 0, length: 0 })
	})

	it('shifts the records after a deleted one down, keeping their order', () => {
		const buffer = new SlotBuffer<string>(2)
		buffer.write('a', [1, 2])
		buffer.write('b', [3, 4])
		buffer.write('c', [5, 6])
		buffer.takeChanges()

		expect(buffer.delete('a')).toEqual(true)
		const { data, offset, length } = buffer.takeChanges()

		expect(buffer.count).toEqual(2)
		expect({ offset, length }).toEqual({ offset: 0, length: 4 })
		expect(Array.from(data.subarray(0, 4))).toEqual([3, 4, 5, 6])
	})

	it('keeps the shifted records addressable by their keys', () => {
		const buffer = new SlotBuffer<string>(2)
		buffer.write('a', [1, 2])
		buffer.write('b', [3, 4])
		buffer.write('c', [5, 6])
		buffer.delete('a')

		buffer.write('c', [9, 9])

		expect(buffer.count).toEqual(2)
		expect(Array.from(buffer.takeChanges().data.subarray(0, 4))).toEqual([3, 4, 9, 9])
	})

	it('reports nothing when the last record is deleted', () => {
		const buffer = new SlotBuffer<string>(2)
		buffer.write('a', [1, 2])
		buffer.write('b', [3, 4])
		buffer.takeChanges()

		buffer.delete('b')

		expect(buffer.count).toEqual(1)
		expect(buffer.takeChanges()).toMatchObject({ offset: 0, length: 0 })
	})

	it('ignores deleting an unknown key', () => {
		const buffer = new SlotBuffer<string>(2)
		buffer.write('a', [1, 2])

		expect(buffer.delete('missing')).toEqual(false)
		expect(buffer.count).toEqual(1)
	})

	it('grows into a new array and keeps existing records', () => {
		const buffer = new SlotBuffer<string>(2, 1)
		buffer.write('a', [1, 2])
		const before = buffer.takeChanges().data

		buffer.write('b', [3, 4])
		const after = buffer.takeChanges().data

		expect(after).not.toBe(before)
		expect(after.length).toBeGreaterThan(before.length)
		expect(Array.from(after.subarray(0, 4))).toEqual([1, 2, 3, 4])
	})
})
