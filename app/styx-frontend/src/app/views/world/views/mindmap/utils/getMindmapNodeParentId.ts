import { MindmapNode } from '@/api/types/mindmapTypes'

export function getMindmapNodeParentId(node: MindmapNode) {
	return (
		node.parentActorId ??
		node.parentArticleId ??
		node.parentEventId ??
		node.parentFolderId ??
		node.parentTagId
	)
}
