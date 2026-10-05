import { MindmapNodeLayout } from '@/app/views/world/views/mindmap/types'

export function getRectCenter(layout: MindmapNodeLayout) {
	return { x: layout.x + layout.width / 2, y: layout.y + layout.height / 2 }
}
