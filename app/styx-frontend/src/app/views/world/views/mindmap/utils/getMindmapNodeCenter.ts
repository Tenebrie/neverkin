import { MindmapNode } from '@/api/types/mindmapTypes'

import { getNodeHeight, NODE_W } from '../workspace/mindmapWireUtils'

export function getMindmapNodeCenter(node: MindmapNode) {
	return { x: node.positionX + NODE_W / 2, y: node.positionY + getNodeHeight(node.id) / 2 }
}
