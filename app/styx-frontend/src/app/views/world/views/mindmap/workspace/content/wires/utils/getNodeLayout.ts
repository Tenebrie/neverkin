import { MindmapNode } from '@/api/types/mindmapTypes'
import { ReactiveMap } from '@/app/features/reactivity/ReactiveMap'
import { MindmapNodeLayout } from '@/app/views/world/views/mindmap/types'

import { NODE_FALLBACK_H, NODE_W } from '../../nodes/ActorNode'

export function getNodeLayout(
	nodeLayouts: ReactiveMap<string, MindmapNodeLayout>,
	node: MindmapNode,
): MindmapNodeLayout {
	return (
		nodeLayouts.get(node.id) ?? {
			x: node.positionX,
			y: node.positionY,
			width: NODE_W,
			height: NODE_FALLBACK_H,
		}
	)
}
