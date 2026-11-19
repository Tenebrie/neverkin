import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { mindmapApi, useDeleteMindmapWaypointsMutation } from '@/api/mindmapApi'
import { AppDispatch } from '@/app/store'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { useCurrentWorldId } from '@/app/views/world/hooks/useCurrentWorldId'

export function useDeleteMindmapWaypoints() {
	const worldId = useCurrentWorldId()
	const dispatch = useDispatch<AppDispatch>()
	const [deleteMindmapWaypoints, state] = useDeleteMindmapWaypointsMutation()

	const optimisticUpdate = useCallback(
		(waypointIds: string[]) => {
			const deleted = new Set(waypointIds)
			return dispatch(
				mindmapApi.util.updateQueryData('getMindmap', { worldId }, (draft) => {
					draft.wires.forEach((wire) => {
						if (!wire.waypoints.some((waypoint) => deleted.has(waypoint.id))) {
							return
						}
						wire.waypoints = wire.waypoints
							.filter((waypoint) => !deleted.has(waypoint.id))
							.map((waypoint, index) => ({ ...waypoint, index: index * 2 }))
					})
				}),
			)
		},
		[dispatch, worldId],
	)

	const perform = useCallback(
		async (waypointIds: string[]) => {
			const patchResult = optimisticUpdate(waypointIds)

			const { response, error } = parseApiResponse(
				await deleteMindmapWaypoints({ worldId, body: { waypointIds } }),
			)
			if (error) {
				dispatch(mindmapApi.util.invalidateTags(['mindmapWire']))
				patchResult.undo()
				return
			}
			return response
		},
		[deleteMindmapWaypoints, dispatch, optimisticUpdate, worldId],
	)

	return [perform, state] as const
}
