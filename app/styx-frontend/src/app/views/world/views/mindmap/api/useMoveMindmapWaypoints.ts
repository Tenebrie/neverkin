import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { mindmapApi, MoveMindmapWaypointsApiArg, useMoveMindmapWaypointsMutation } from '@/api/mindmapApi'
import { AppDispatch } from '@/app/store'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { useCurrentWorldId } from '@/app/views/world/hooks/useCurrentWorldId'

export function useMoveMindmapWaypoints() {
	const worldId = useCurrentWorldId()
	const dispatch = useDispatch<AppDispatch>()
	const [moveMindmapWaypoints, state] = useMoveMindmapWaypointsMutation()

	const updateCachedWaypoints = useCallback(
		(body: MoveMindmapWaypointsApiArg['body']) => {
			const moved = new Set(body.waypointIds)
			return dispatch(
				mindmapApi.util.updateQueryData('getMindmap', { worldId }, (draft) => {
					draft.wires.forEach((wire) => {
						wire.waypoints.forEach((waypoint) => {
							if (moved.has(waypoint.id)) {
								waypoint.positionX = body.positionX
								waypoint.positionY = body.positionY
							}
						})
					})
				}),
			)
		},
		[dispatch, worldId],
	)

	const perform = useCallback(
		async (body: MoveMindmapWaypointsApiArg['body']) => {
			const patchResult = updateCachedWaypoints(body)

			const { response, error } = parseApiResponse(await moveMindmapWaypoints({ worldId, body }))
			if (error) {
				patchResult.undo()
				return
			}
			return response
		},
		[updateCachedWaypoints, moveMindmapWaypoints, worldId],
	)

	return [perform, state] as const
}
