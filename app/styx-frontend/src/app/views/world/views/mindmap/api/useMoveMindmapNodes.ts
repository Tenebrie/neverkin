import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { mindmapApi, MoveMindmapNodesApiArg, useMoveMindmapNodesMutation } from '@/api/mindmapApi'
import { AppDispatch } from '@/app/store'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { getWorldIdState } from '@/app/views/world/WorldSliceSelectors'

export function useMoveMindmapNodes() {
	const worldId = useSelector(getWorldIdState)
	const dispatch = useDispatch<AppDispatch>()
	const [moveMindmapNodes, state] = useMoveMindmapNodesMutation()

	const updateCachedNodes = useCallback(
		(body: MoveMindmapNodesApiArg['body']) => {
			return dispatch(
				mindmapApi.util.updateQueryData('getMindmap', { worldId }, (draft) => {
					body.nodeIds.forEach((id) => {
						const node = draft.nodes.find((n) => n.id === id)
						if (node) {
							node.positionX += body.deltaX
							node.positionY += body.deltaY
						}
					})
				}),
			)
		},
		[dispatch, worldId],
	)

	const perform = useCallback(
		async (body: MoveMindmapNodesApiArg['body']) => {
			const patchResult = updateCachedNodes(body)

			const { response, error } = parseApiResponse(
				await moveMindmapNodes({
					worldId,
					body,
				}),
			)
			if (error) {
				patchResult.undo()
				return
			}
			return response
		},
		[updateCachedNodes, moveMindmapNodes, worldId],
	)

	return [perform, state] as const
}
