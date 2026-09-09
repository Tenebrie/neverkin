export function getInitials(name: string) {
	const capitals = name.replace(/[^A-Z]+/g, '')
	if (capitals.length >= 2) {
		return capitals.substring(0, 2)
	}
	return name.substring(0, 2)
}
