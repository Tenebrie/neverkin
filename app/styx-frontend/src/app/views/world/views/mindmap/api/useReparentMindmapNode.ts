import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { mindmapApi, ReparentNodeApiArg, useReparentNodeMutation } from '@/api/mindmapApi'
import { AppDispatch } from '@/app/store'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { useCurrentWorldId } from '@/app/views/world/hooks/useCurrentWorldId'

export function useReparentMindmapNode() {
	const worldId = useCurrentWorldId()
	const dispatch = useDispatch<AppDispatch>()
	const [reparentNode, state] = useReparentNodeMutation()

	const updateCachedNode = useCallback(
		(nodeId: string, body: ReparentNodeApiArg['body']) => {
			return dispatch(
				mindmapApi.util.updateQueryData('getMindmap', { worldId }, (draft) => {
					const node = draft.nodes.find((n) => n.id === nodeId)
					if (node) {
						Object.assign(node, body)
					}
				}),
			)
		},
		[dispatch, worldId],
	)

	const perform = useCallback(
		async (nodeId: string, body: ReparentNodeApiArg['body']) => {
			const patchResult = updateCachedNode(nodeId, body)

			const { response, error } = parseApiResponse(
				await reparentNode({
					worldId,
					nodeId,
					body,
				}),
			)
			if (error) {
				patchResult.undo()
				return
			}
			return response
		},
		[updateCachedNode, reparentNode, worldId],
	)

	return [perform, state] as const
}
