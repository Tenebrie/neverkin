import { MindmapState } from '../MindmapState'

type Props = {
	screenX: number
	screenY: number
}

export function toWorkspaceCoords({ screenX, screenY }: Props) {
	const { workspaceRect, cameraX, cameraY, scale } = MindmapState
	if (!workspaceRect) {
		return null
	}
	return {
		x: (screenX - workspaceRect.x + cameraX) / scale,
		y: (screenY - workspaceRect.y + cameraY) / scale,
	}
}
