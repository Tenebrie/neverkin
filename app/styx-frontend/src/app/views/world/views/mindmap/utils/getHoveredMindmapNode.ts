import { DragDropState } from '@/app/features/dragDrop/DragDropState'

export function getHoveredMindmapNode() {
	return DragDropState.current?.hovered.find((element) => element.hasAttribute('data-mindmap-node'))
}
