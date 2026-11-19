import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { v4 as getRandomId } from 'uuid'

import { CreateMindmapWaypointsApiArg, mindmapApi, useCreateMindmapWaypointsMutation } from '@/api/mindmapApi'
import { AppDispatch } from '@/app/store'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { useCurrentWorldId } from '@/app/views/world/hooks/useCurrentWorldId'

type Body = CreateMindmapWaypointsApiArg['body']
type Target = Body['targets'][number]

export function useCreateMindmapWaypoints() {
	const worldId = useCurrentWorldId()
	const dispatch = useDispatch<AppDispatch>()
	const [createMindmapWaypoints, state] = useCreateMindmapWaypointsMutation()

	const updateCachedWaypoints = useCallback(
		(body: Body) => {
			return dispatch(
				mindmapApi.util.updateQueryData('getMindmap', { worldId }, (draft) => {
					draft.wires.forEach((wire) => {
						const target = body.targets.find((candidate) => candidate.wireId === wire.id)
						if (!target) {
							return
						}
						const inserted = {
							id: target.id,
							linkId: wire.id,
							index: target.index,
							positionX: body.positionX,
							positionY: body.positionY,
						}
						wire.waypoints = wire.waypoints
							.toSpliced(target.index, 0, inserted)
							.map((waypoint, index) => ({ ...waypoint, index: index * 2 }))
					})
				}),
			)
		},
		[dispatch, worldId],
	)

	const perform = useCallback(
		async ({ targets, ...position }: Omit<Body, 'targets'> & { targets: Omit<Target, 'id'>[] }) => {
			const body = { ...position, targets: targets.map((target) => ({ ...target, id: getRandomId() })) }
			const patchResult = updateCachedWaypoints(body)

			const { response, error } = parseApiResponse(await createMindmapWaypoints({ worldId, body }))
			if (error) {
				patchResult.undo()
				return
			}
			return response
		},
		[createMindmapWaypoints, updateCachedWaypoints, worldId],
	)

	return [perform, state] as const
}
