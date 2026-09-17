export function replaceOnce({
	content,
	oldString,
	newString,
}: {
	content: string
	oldString: string
	newString: string
}) {
	const occurrences = content.split(oldString).length - 1
	if (occurrences === 0) {
		throw new Error('The old content was not found in the current content.')
	}
	if (occurrences > 1) {
		throw new Error(
			`The old content appears ${occurrences} times. Include more surrounding text to make it unique.`,
		)
	}
	return content.replace(oldString, () => newString)
}
