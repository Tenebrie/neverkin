import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { mindmapApi, useDeleteMindmapWiresMutation } from '@/api/mindmapApi'
import { AppDispatch } from '@/app/store'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { useCurrentWorldId } from '@/app/views/world/hooks/useCurrentWorldId'

export function useDeleteMindmapWires() {
	const worldId = useCurrentWorldId()
	const dispatch = useDispatch<AppDispatch>()
	const [deleteMindmapWires, state] = useDeleteMindmapWiresMutation()

	const optimisticUpdate = useCallback(
		(wires: string[]) => {
			return dispatch(
				mindmapApi.util.updateQueryData('getMindmap', { worldId }, (draft) => {
					draft.wires = draft.wires.filter((wire) => !wires.includes(wire.id))
				}),
			)
		},
		[dispatch, worldId],
	)

	const perform = useCallback(
		async (wires: string[]) => {
			const patchResult = optimisticUpdate(wires)

			const { response, error } = parseApiResponse(
				await deleteMindmapWires({
					worldId,
					body: {
						wires,
					},
				}),
			)
			if (error) {
				dispatch(mindmapApi.util.invalidateTags(['mindmapWire']))
				patchResult.undo()
				return
			}
			return response
		},
		[deleteMindmapWires, dispatch, optimisticUpdate, worldId],
	)

	return [perform, state] as const
}
