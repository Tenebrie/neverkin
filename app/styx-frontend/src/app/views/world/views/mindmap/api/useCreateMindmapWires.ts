import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { CreateMindmapWiresApiArg, mindmapApi, useCreateMindmapWiresMutation } from '@/api/mindmapApi'
import { MindmapWire } from '@/api/types/mindmapTypes'
import { AppDispatch } from '@/app/store'
import { parseApiResponse } from '@/app/utils/parseApiResponse'

import { useCurrentWorldId } from '../../../hooks/useCurrentWorldId'

export function useCreateMindmapWires() {
	const worldId = useCurrentWorldId()
	const dispatch = useDispatch<AppDispatch>()
	const [createMindmapWire, state] = useCreateMindmapWiresMutation()

	const updateCachedWires = useCallback(
		(wires: (Pick<MindmapWire, 'sourceNodeId' | 'targetNodeId'> & Partial<MindmapWire>)[]) => {
			return dispatch(
				mindmapApi.util.updateQueryData('getMindmap', { worldId }, (draft) => {
					wires.forEach((wire) => {
						const existingWire = draft.wires.find((existing) => {
							const isMatching =
								existing.sourceNodeId === wire.sourceNodeId && existing.targetNodeId === wire.targetNodeId
							const isReversedMatching =
								existing.sourceNodeId === wire.targetNodeId && existing.targetNodeId === wire.sourceNodeId
							return isMatching || isReversedMatching
						})
						if (existingWire) {
							draft.wires = draft.wires.filter((existing) => existing.id !== existingWire.id)
						}
						const direction =
							!existingWire || existingWire.sourceNodeId === wire.sourceNodeId ? 'Normal' : 'Reversed'
						draft.wires.push({
							id: wire.id ?? existingWire?.id ?? `temp-${Math.random()}`,
							createdAt: wire.createdAt ?? existingWire?.createdAt ?? new Date().toISOString(),
							updatedAt: wire.updatedAt ?? existingWire?.updatedAt ?? new Date().toISOString(),
							sourceNodeId: wire.sourceNodeId,
							targetNodeId: wire.targetNodeId,
							direction: wire.direction ?? direction,
							content: wire.content ?? existingWire?.content ?? '',
						})
					})
				}),
			)
		},
		[dispatch, worldId],
	)

	const perform = useCallback(
		async (wires: CreateMindmapWiresApiArg['body']['wires']) => {
			const patchResult = updateCachedWires(wires)

			const { response, error } = parseApiResponse(
				await createMindmapWire({
					worldId,
					body: { wires },
				}),
			)
			patchResult.undo()
			if (error) {
				return
			}

			// Reapply patch to get correct IDs
			updateCachedWires([...response.created, ...response.updated])
			return response
		},
		[createMindmapWire, updateCachedWires, worldId],
	)

	return [perform, state] as const
}
