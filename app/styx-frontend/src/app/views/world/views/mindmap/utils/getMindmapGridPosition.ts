type Props = {
	screenX: number
	screenY: number
}

export function getMindmapGridPosition({ screenX, screenY }: Props) {
	const grid = document.querySelector<HTMLElement>('[data-mindmap-grid]')
	const camera = document.querySelector<HTMLElement>('[data-mindmap-camera]')
	if (!grid || !camera) {
		return null
	}

	const boundingBox = grid.getBoundingClientRect()
	const style = getComputedStyle(camera)
	const offsetX = parseFloat(style.getPropertyValue('--grid-offset-x'))
	const offsetY = parseFloat(style.getPropertyValue('--grid-offset-y'))
	const scale = parseFloat(style.getPropertyValue('--grid-scale'))

	return {
		x: (screenX - boundingBox.x - offsetX) / scale,
		y: (screenY - boundingBox.y - offsetY) / scale,
	}
}
