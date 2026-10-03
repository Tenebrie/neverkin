import { RefObject } from 'react'
import { useStore } from 'react-redux'

import { useDragDropReceiver } from '@/app/features/dragDrop/hooks/useDragDropReceiver'
import { dispatchGlobalEvent } from '@/app/features/eventBus'
import { RootState } from '@/app/store'
import { getSelectedNodeKeys } from '@/app/views/world/views/mindmap/MindmapSliceSelectors'

type Props = {
	ref: RefObject<HTMLDivElement | null>
}

export function useWireDropReceiver({ ref }: Props) {
	const store = useStore<RootState>()

	useDragDropReceiver({
		type: 'actorNodeLinking',
		receiverRef: ref,
		onDrop: ({ params }, { mouseEvent }) => {
			if (!mouseEvent || mouseEvent.button !== 0) {
				return
			}

			const sourceId = params.sourceNode.id
			const selectedKeys = getSelectedNodeKeys(store.getState())
			const sourceNodeIds = selectedKeys.includes(sourceId) ? selectedKeys : [sourceId]

			dispatchGlobalEvent['quickSelect/requestOpen']({
				query: '',
				screenPosTop: mouseEvent.clientY,
				screenPosBottom: mouseEvent.clientY,
				screenPosLeft: mouseEvent.clientX,
			})
			dispatchGlobalEvent['mindmap/wire/requestNodeTarget']({ sourceNodeIds })
		},
	})
}
