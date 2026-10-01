import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { mindmapApi, UpdateNodeApiArg, useUpdateNodeMutation } from '@/api/mindmapApi'
import { AppDispatch } from '@/app/store'
import { parseApiResponse } from '@/app/utils/parseApiResponse'

import { useCurrentWorldId } from '../../../hooks/useCurrentWorldId'

export function useUpdateMindmapNode() {
	const worldId = useCurrentWorldId()
	const dispatch = useDispatch<AppDispatch>()
	const [updateMindmapNode, state] = useUpdateNodeMutation()

	const updateCachedNode = useCallback(
		(nodeId: string, body: UpdateNodeApiArg['body']) => {
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
		async (nodeId: string, body: UpdateNodeApiArg['body']) => {
			const patchResult = updateCachedNode(nodeId, body)

			const { response, error } = parseApiResponse(
				await updateMindmapNode({
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
		[updateCachedNode, updateMindmapNode, worldId],
	)

	return [perform, state, updateCachedNode] as const
}
