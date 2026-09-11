export function sortPipe<T>(...comparators: Array<(a: T, b: T) => number>) {
	return (a: T, b: T) => {
		for (const comparator of comparators) {
			const result = comparator(a, b)
			if (result !== 0) return result
		}
		return 0
	}
}
