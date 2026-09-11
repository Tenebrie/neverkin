export function recentFirst<T extends { updatedAt: string }>(a: T, b: T) {
	return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}
