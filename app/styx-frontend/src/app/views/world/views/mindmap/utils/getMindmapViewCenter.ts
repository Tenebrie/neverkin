import { getMindmapGridPosition } from './getMindmapGridPosition'

/**
 * Grid position at the center of the mindmap viewport, or null when the mindmap is not on screen.
 */
export function getMindmapViewCenter() {
	const grid = document.querySelector<HTMLElement>('[data-mindmap-grid]')
	if (!grid) {
		return null
	}
	const rect = grid.getBoundingClientRect()
	return getMindmapGridPosition({ screenX: rect.x + rect.width / 2, screenY: rect.y + rect.height / 2 })
}
