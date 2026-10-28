export function pluralize(count: number, noun: string) {
	return `${count.toLocaleString()} ${count === 1 ? noun : `${noun}s`}`
}
