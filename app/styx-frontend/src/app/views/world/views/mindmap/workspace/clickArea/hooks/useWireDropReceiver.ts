import { RefObject } from 'react'

import { useDragDropReceiver } from '@/app/features/dragDrop/hooks/useDragDropReceiver'
import { dispatchGlobalEvent } from '@/app/features/eventBus'
import { useMindmapSelectionContext } from '@/app/views/world/views/mindmap/context/useMindmapContext'

type Props = {
	ref: RefObject<HTMLDivElement | null>
}

export function useWireDropReceiver({ ref }: Props) {
	const { selectedNodes } = useMindmapSelectionContext()

	useDragDropReceiver({
		type: 'mindmapNodeLinking',
		receiverRef: ref,
		onDrop: ({ params }, { mouseEvent }) => {
			if (!mouseEvent || mouseEvent.button !== 0) {
				return
			}

			const sourceId = params.sourceNodeId
			const selectedKeys = selectedNodes.keys()
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
