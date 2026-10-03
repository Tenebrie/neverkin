import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { v4 as getRandomId } from 'uuid'

import { CreateNodeApiArg, mindmapApi, useCreateNodeMutation } from '@/api/mindmapApi'
import { AppDispatch } from '@/app/store'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { useCurrentWorldId } from '@/app/views/world/hooks/useCurrentWorldId'

export function useCreateMindmapNode() {
	const worldId = useCurrentWorldId()
	const dispatch = useDispatch<AppDispatch>()
	const [createMindmapNode, state] = useCreateNodeMutation()

	const addCachedNode = useCallback(
		(id: string, body: CreateNodeApiArg['body']) => {
			return dispatch(
				mindmapApi.util.updateQueryData('getMindmap', { worldId }, (draft) => {
					draft.nodes.push({
						worldId,
						name: '',
						content: '',
						contentRich: '',
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
						...body,
						id,
					})
				}),
			)
		},
		[dispatch, worldId],
	)

	const perform = useCallback(
		async (body: CreateNodeApiArg['body']) => {
			body.id = body.id ?? getRandomId()
			const patchResult = addCachedNode(body.id, body)

			const { response, error } = parseApiResponse(
				await createMindmapNode({
					worldId,
					body,
				}),
			)
			patchResult.undo()
			if (error) {
				return
			}

			// Reapply patch to get the correct id
			addCachedNode(response.id, body)
			return response
		},
		[addCachedNode, createMindmapNode, worldId],
	)

	return [perform, state] as const
}
