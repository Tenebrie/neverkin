import { useEventBusSubscribe } from '@/app/features/eventBus'

import { useCreateMindmapWires } from '../api/useCreateMindmapWires'
import { useDeleteMindmapWires } from '../api/useDeleteMindmapWires'
import { useMoveMindmapNodes } from '../api/useMoveMindmapNodes'
import { useReparentMindmapNode } from '../api/useReparentMindmapNode'

/**
 * Owns every mindmap mutation hook on behalf of the whole view. Each hook carries RTK Query
 * subscriptions, so mounting them per node meant thousands of selectors rerunning on every
 * dispatch. Nodes and wires ask for their mutation through the event bus instead.
 */
export function MindmapMutationBridge() {
	const [createMindmapWires] = useCreateMindmapWires()
	const [deleteMindmapWires] = useDeleteMindmapWires()
	const [moveMindmapNodes] = useMoveMindmapNodes()
	const [reparentMindmapNode] = useReparentMindmapNode()

	useEventBusSubscribe['mindmap/node/requestMove']({
		callback: ({ nodeIds, deltaX, deltaY }) => {
			moveMindmapNodes({ nodeIds, deltaX, deltaY })
		},
	})

	useEventBusSubscribe['mindmap/node/requestReparent']({
		callback: ({ nodeId, body }) => {
			reparentMindmapNode(nodeId, body)
		},
	})

	useEventBusSubscribe['mindmap/wire/requestCreate']({
		callback: ({ wires }) => {
			createMindmapWires(wires)
		},
	})

	useEventBusSubscribe['mindmap/wire/requestDelete']({
		callback: ({ wireIds }) => {
			deleteMindmapWires(wireIds)
		},
	})

	return null
}
