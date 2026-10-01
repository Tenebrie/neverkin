import { useRef } from 'react'

import { DragDropStateType } from '@/app/features/dragDrop/DragDropState'
import { useDragDropBusSubscribe } from '@/app/features/dragDrop/hooks/useDragDropBus'
import { AllowedDraggableType } from '@/app/features/dragDrop/types'
import { dispatchGlobalEvent } from '@/app/features/eventBus'

export function MindmapNodeDropTargetReporter() {
	const lastTarget = useRef<HTMLElement | null>(null)
	useDragDropBusSubscribe({
		callback: (state) => {
			const target = getDropTarget(state)
			if (target === lastTarget.current) {
				return
			}
			lastTarget.current = target
			dispatchGlobalEvent['mindmap/dropTarget/changed']({ target })
		},
	})
	return null
}

function getDropTarget(state: DragDropStateType<AllowedDraggableType> | null) {
	if (!state || state.isHandled) {
		return null
	}
	return state.hovered.find((element) => element.hasAttribute('data-mindmap-node')) ?? null
}
