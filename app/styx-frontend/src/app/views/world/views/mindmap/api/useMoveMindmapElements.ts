import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { mindmapApi, MoveMindmapElementsApiArg, useMoveMindmapElementsMutation } from '@/api/mindmapApi'
import { AppDispatch } from '@/app/store'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { useCurrentWorldId } from '@/app/views/world/hooks/useCurrentWorldId'

export function useMoveMindmapElements() {
	const worldId = useCurrentWorldId()
	const dispatch = useDispatch<AppDispatch>()
	const [moveMindmapElements, state] = useMoveMindmapElementsMutation()

	const updateCachedPositions = useCallback(
		(body: MoveMindmapElementsApiArg['body']) => {
			const movedNodes = new Set(body.nodeIds)
			const movedWaypoints = new Set(body.waypointIds)
			return dispatch(
				mindmapApi.util.updateQueryData('getMindmap', { worldId }, (draft) => {
					draft.nodes.forEach((node) => {
						if (movedNodes.has(node.id)) {
							node.positionX += body.deltaX
							node.positionY += body.deltaY
						}
					})
					draft.wires.forEach((wire) => {
						wire.waypoints.forEach((waypoint) => {
							if (movedWaypoints.has(waypoint.id)) {
								waypoint.positionX += body.deltaX
								waypoint.positionY += body.deltaY
							}
						})
					})
				}),
			)
		},
		[dispatch, worldId],
	)

	const perform = useCallback(
		async (body: MoveMindmapElementsApiArg['body']) => {
			const patchResult = updateCachedPositions(body)

			const { response, error } = parseApiResponse(await moveMindmapElements({ worldId, body }))
			if (error) {
				patchResult.undo()
				return
			}
			return response
		},
		[updateCachedPositions, moveMindmapElements, worldId],
	)

	return [perform, state] as const
}
