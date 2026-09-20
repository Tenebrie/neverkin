import { CANVAS_ORIGIN } from './mindmapCanvas'

type Props = {
	screenX: number
	screenY: number
}

export function getMindmapGridPosition({ screenX, screenY }: Props) {
	const grid = document.querySelector<HTMLElement>('[data-mindmap-grid]')
	if (!grid) {
		return null
	}

	const boundingBox = grid.getBoundingClientRect()
	const scale = parseFloat(getComputedStyle(grid).getPropertyValue('--grid-scale'))

	return {
		x: (screenX - boundingBox.x + grid.scrollLeft) / scale - CANVAS_ORIGIN,
		y: (screenY - boundingBox.y + grid.scrollTop) / scale - CANVAS_ORIGIN,
	}
}
