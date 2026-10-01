export type MindmapNavigationState = ReturnType<typeof makeMindmapNavigationState>

export function makeMindmapNavigationState() {
	return {
		canClick: false,
		totalOffsetFromStart: 0,
		offsetFromStartX: 0,
		offsetFromStartY: 0,
		isDragging: false,
		dragMode: 'select' as 'select' | 'pan',
		gridScale: 1.0,
		targetScrollLeft: 0,
		targetScrollTop: 0,
		lastTrackpadPanAt: -Infinity,
		pinchStartScale: 1,
	}
}

export const MindmapState = {
	scale: 1,
	cameraX: 0,
	cameraY: 0,
	workspaceRect: null as DOMRect | null,
}
