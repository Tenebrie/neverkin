import { RefObject } from 'react'

import { useDragDropReceiver } from '@/app/features/dragDrop/hooks/useDragDropReceiver'

import { useCreateMindmapNode } from '../api/useCreateMindmapNode'
import { getMindmapDroppedNodeParams as getMindmapDroppedNodeParams } from '../utils/getMindmapDroppedNodeParams'

type Props = {
	ref: RefObject<HTMLDivElement | null>
}

export function useNewNodeReceiver({ ref }: Props) {
	const [createMindmapNode] = useCreateMindmapNode()

	useDragDropReceiver({
		type: 'articleListItem',
		receiverRef: ref,
		onDrop: ({ params, targetPos }, { markHandled }) => {
			markHandled()

			const fields = getMindmapDroppedNodeParams(params.article, targetPos)
			if (fields) {
				createMindmapNode(fields)
			}
		},
	})

	return { ref }
}
