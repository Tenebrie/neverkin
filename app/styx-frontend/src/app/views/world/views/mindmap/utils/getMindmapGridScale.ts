export function getMindmapGridScale() {
	const grid = document.querySelector<HTMLElement>('[data-mindmap-grid]')
	if (!grid) {
		return null
	}

	return parseFloat(getComputedStyle(grid).getPropertyValue('--grid-scale'))
}
