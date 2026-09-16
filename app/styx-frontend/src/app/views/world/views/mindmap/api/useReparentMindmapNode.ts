import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { mindmapApi, useReparentNodeMutation } from '@/api/mindmapApi'
import { AppDispatch } from '@/app/store'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { getWorldIdState } from '@/app/views/world/WorldSliceSelectors'

import { getMindmapDroppedNodeParams } from '../utils/getMindmapDroppedNodeParams'

export function useReparentMindmapNode() {
	const worldId = useSelector(getWorldIdState)
	const dispatch = useDispatch<AppDispatch>()
	const [reparentNode, state] = useReparentNodeMutation()

	const perform = useCallback(
		async (nodeId: string, body: NonNullable<ReturnType<typeof getMindmapDroppedNodeParams>>) => {
			const patchResult = dispatch(
				mindmapApi.util.updateQueryData('getMindmap', { worldId }, (draft) => {
					const node = draft.nodes.find((n) => n.id === nodeId)
					if (node) {
						Object.assign(node, body)
					}
				}),
			)

			const { response, error } = parseApiResponse(await reparentNode({ worldId, nodeId, body }))
			if (error) {
				patchResult.undo()
				return
			}
			return response
		},
		[dispatch, reparentNode, worldId],
	)

	return [perform, state] as const
}
