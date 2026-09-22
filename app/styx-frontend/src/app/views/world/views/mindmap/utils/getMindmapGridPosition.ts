import { CANVAS_ORIGIN } from './mindmapCanvas'
import { MindmapState } from './MindmapState'

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
	const scale = MindmapState.scale

	return {
		x: (screenX - boundingBox.x + grid.scrollLeft - CANVAS_ORIGIN) / scale,
		y: (screenY - boundingBox.y + grid.scrollTop - CANVAS_ORIGIN) / scale,
	}
}
