import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { mindmapApi, useDeleteNodesMutation } from '@/api/mindmapApi'
import { AppDispatch } from '@/app/store'
import { parseApiResponse } from '@/app/utils/parseApiResponse'

import { useCurrentWorldId } from '../../../hooks/useCurrentWorldId'

export function useDeleteMindmapNodes() {
	const worldId = useCurrentWorldId()
	const dispatch = useDispatch<AppDispatch>()
	const [deleteMindmapNodes, state] = useDeleteNodesMutation()

	const removeCachedNode = useCallback(
		(nodes: string[]) => {
			return dispatch(
				mindmapApi.util.updateQueryData('getMindmap', { worldId }, (draft) => {
					for (const id of nodes) {
						const index = draft.nodes.findIndex((node) => node.id === id)
						if (index === -1) {
							continue
						}
						draft.nodes.splice(index, 1)
					}
				}),
			)
		},
		[dispatch, worldId],
	)

	const perform = useCallback(
		async (nodes: string[]) => {
			const transaction = removeCachedNode(nodes)
			const { response, error } = parseApiResponse(
				await deleteMindmapNodes({
					worldId,
					nodes,
				}),
			)
			if (error) {
				dispatch(mindmapApi.util.invalidateTags(['mindmapNode']))
				transaction.undo()
				return
			}
			return response
		},
		[deleteMindmapNodes, dispatch, removeCachedNode, worldId],
	)

	return [perform, state] as const
}
