import { shallowEqual } from 'react-redux'

export function replaceChangedElements<T extends { id: string }>(prev: T[], next: T[]) {
	const prevById = new Map(prev.map((item) => [item.id, item]))
	const result = next.map((item) => {
		const old = prevById.get(item.id)
		if (old && shallowEqual(old, item)) {
			return old
		}
		return item
	})
	if (isSameList(prev, result)) {
		return prev
	}
	return result
}

function isSameList<T>(a: T[], b: T[]) {
	return a.length === b.length && a.every((value, index) => value === b[index])
}
