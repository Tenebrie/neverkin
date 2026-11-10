export function toLowerCase<T extends string>(value: T) {
	return value.toLowerCase() as Lowercase<T>
}
