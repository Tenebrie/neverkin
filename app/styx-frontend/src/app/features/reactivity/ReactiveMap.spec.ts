import { describe, expect, it, rstest } from '@rstest/core'

import { ReactiveMap } from './ReactiveMap'

describe('ReactiveMap', () => {
	describe('set', () => {
		it('stores the value under its key', () => {
			const map = new ReactiveMap<string, number>()
			map.set('a', 1)

			expect(map.get('a')).toEqual(1)
			expect(map.keys()).toEqual(['a'])
		})

		it('notifies only the subscribers of the changed key', () => {
			const map = new ReactiveMap<string, number>()
			map.set('a', 1)
			map.set('b', 2)
			const onA = rstest.fn()
			const onB = rstest.fn()
			map.subscribe('a', onA)
			map.subscribe('b', onB)

			map.set('a', 3)

			expect(onA).toHaveBeenCalledTimes(1)
			expect(onB).not.toHaveBeenCalled()
		})

		it('notifies nobody when the value is the same', () => {
			const map = new ReactiveMap<string, { x: number }>()
			const value = { x: 1 }
			map.set('a', value)
			const onA = rstest.fn()
			const onKeys = rstest.fn()
			map.subscribe('a', onA)
			map.subscribeToKeys(onKeys)

			map.set('a', value)

			expect(onA).not.toHaveBeenCalled()
			expect(onKeys).not.toHaveBeenCalled()
		})

		it('notifies key subscribers when a key is added', () => {
			const map = new ReactiveMap<string, number>()
			const onKeys = rstest.fn()
			map.subscribeToKeys(onKeys)

			map.set('a', 1)

			expect(onKeys).toHaveBeenCalledTimes(1)
		})

		it('does not notify key subscribers when only a value changes', () => {
			const map = new ReactiveMap<string, number>()
			map.set('a', 1)
			const onKeys = rstest.fn()
			map.subscribeToKeys(onKeys)

			map.set('a', 2)

			expect(onKeys).not.toHaveBeenCalled()
		})
	})

	describe('delete', () => {
		it('removes the key and notifies its subscribers and key subscribers', () => {
			const map = new ReactiveMap<string, number>()
			map.set('a', 1)
			const onA = rstest.fn()
			const onKeys = rstest.fn()
			map.subscribe('a', onA)
			map.subscribeToKeys(onKeys)

			map.delete('a')

			expect(map.get('a')).toBeUndefined()
			expect(map.keys()).toEqual([])
			expect(onA).toHaveBeenCalledTimes(1)
			expect(onKeys).toHaveBeenCalledTimes(1)
		})

		it('ignores an unknown key', () => {
			const map = new ReactiveMap<string, number>()
			map.set('a', 1)
			const onKeys = rstest.fn()
			map.subscribeToKeys(onKeys)

			map.delete('missing')

			expect(map.keys()).toEqual(['a'])
			expect(onKeys).not.toHaveBeenCalled()
		})
	})

	describe('keys', () => {
		it('returns the same array while the keys are unchanged', () => {
			const map = new ReactiveMap<string, number>()
			map.set('a', 1)
			map.set('b', 2)
			const before = map.keys()

			map.set('a', 3)
			map.replace(
				new Map([
					['a', 4],
					['b', 5],
				]),
			)

			expect(map.keys()).toBe(before)
		})

		it('returns a new array once a key is added or removed', () => {
			const map = new ReactiveMap<string, number>()
			map.set('a', 1)
			const initial = map.keys()

			map.set('b', 2)
			const afterAdd = map.keys()
			map.delete('a')
			const afterDelete = map.keys()

			expect(afterAdd).not.toBe(initial)
			expect(afterAdd).toEqual(['a', 'b'])
			expect(afterDelete).not.toBe(afterAdd)
			expect(afterDelete).toEqual(['b'])
		})
	})

	describe('replace', () => {
		it('notifies only the keys that were added, removed or changed', () => {
			const map = new ReactiveMap<string, { x: number }>()
			const kept = { x: 1 }
			map.set('kept', kept)
			map.set('changed', { x: 2 })
			map.set('removed', { x: 3 })
			const listeners = {
				kept: rstest.fn(),
				changed: rstest.fn(),
				removed: rstest.fn(),
				added: rstest.fn(),
			}
			for (const [key, listener] of Object.entries(listeners)) {
				map.subscribe(key, listener)
			}

			map.replace(
				new Map([
					['kept', kept],
					['changed', { x: 20 }],
					['added', { x: 4 }],
				]),
			)

			expect(listeners.kept).not.toHaveBeenCalled()
			expect(listeners.changed).toHaveBeenCalledTimes(1)
			expect(listeners.removed).toHaveBeenCalledTimes(1)
			expect(listeners.added).toHaveBeenCalledTimes(1)
			expect(map.get('removed')).toBeUndefined()
			expect(map.get('added')).toEqual({ x: 4 })
		})

		it('does not notify key subscribers when the keys are the same', () => {
			const map = new ReactiveMap<string, number>()
			map.set('a', 1)
			map.set('b', 2)
			const onKeys = rstest.fn()
			map.subscribeToKeys(onKeys)

			map.replace(
				new Map([
					['a', 10],
					['b', 20],
				]),
			)

			expect(onKeys).not.toHaveBeenCalled()
		})

		it('notifies key subscribers when the key order changes', () => {
			const map = new ReactiveMap<string, number>()
			map.set('a', 1)
			map.set('b', 2)
			const onKeys = rstest.fn()
			map.subscribeToKeys(onKeys)

			map.replace(
				new Map([
					['b', 2],
					['a', 1],
				]),
			)

			expect(onKeys).toHaveBeenCalledTimes(1)
			expect(map.keys()).toEqual(['b', 'a'])
		})

		it('notifies nobody when nothing changed', () => {
			const map = new ReactiveMap<string, number>()
			map.set('a', 1)
			const onA = rstest.fn()
			const onKeys = rstest.fn()
			map.subscribe('a', onA)
			map.subscribeToKeys(onKeys)

			map.replace(new Map([['a', 1]]))

			expect(onA).not.toHaveBeenCalled()
			expect(onKeys).not.toHaveBeenCalled()
		})
	})

	describe('subscriptions', () => {
		it('stops notifying a key subscriber after it unsubscribes', () => {
			const map = new ReactiveMap<string, number>()
			const onA = rstest.fn()
			const unsubscribe = map.subscribe('a', onA)

			unsubscribe()
			map.set('a', 1)

			expect(onA).not.toHaveBeenCalled()
		})

		it('stops notifying a keys subscriber after it unsubscribes', () => {
			const map = new ReactiveMap<string, number>()
			const onKeys = rstest.fn()
			const unsubscribe = map.subscribeToKeys(onKeys)

			unsubscribe()
			map.set('a', 1)

			expect(onKeys).not.toHaveBeenCalled()
		})
	})
})
