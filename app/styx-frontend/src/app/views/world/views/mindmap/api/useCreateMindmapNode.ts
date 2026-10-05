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
						positionX: 0,
						positionY: 0,
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
			const id = body.id ?? getRandomId()
			body.id = id
			addCachedNode(id, body)

			const { response, error } = parseApiResponse(
				await createMindmapNode({
					worldId,
					body,
				}),
			)
			dispatch(
				mindmapApi.util.updateQueryData('getMindmap', { worldId }, (draft) => {
					draft.nodes = error
						? draft.nodes.filter((node) => node.id !== id)
						: draft.nodes.map((node) => (node.id === id ? response : node))
				}),
			)
			return response
		},
		[addCachedNode, createMindmapNode, dispatch, worldId],
	)

	return [perform, state] as const
}
