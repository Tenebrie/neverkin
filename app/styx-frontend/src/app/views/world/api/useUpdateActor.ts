import { useCallback } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'

import { UpdateActorApiArg, useUpdateActorMutation } from '@/api/actorListApi'
import { useActorApiCache } from '@/api/hooks/useActorApiCache'
import { ActorDetails } from '@/api/types/worldTypes'
import { worldDetailsApi } from '@/api/worldDetailsApi'
import { RootState } from '@/app/store'
import { ingestActor } from '@/app/utils/ingestEntity'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { getWorldIdState } from '@/app/views/world/WorldSliceSelectors'

export const useUpdateActor = () => {
	const worldId = useSelector(getWorldIdState)
	const [updateWorldActor, state] = useUpdateActorMutation()
	const { updateCachedActor } = useActorApiCache()
	const store = useStore<RootState>()

	const dispatch = useDispatch()

	const perform = useCallback(
		async (id: string, body: UpdateActorApiArg['body'], onBeforeSave?: (actor: ActorDetails) => void) => {
			const oldIcon = store.getState().world.actors.find((e) => e.id === id)?.icon

			const { response, error } = parseApiResponse(
				await updateWorldActor({
					worldId,
					actorId: id,
					body,
				}),
			)
			if (error) {
				return
			}

			const actor = ingestActor(response)
			onBeforeSave?.(actor)

			// Invalidate common icons query cache if icon has changed
			if (body.icon !== undefined && body.icon !== oldIcon) {
				dispatch(worldDetailsApi.util.invalidateTags([{ type: 'worldCommonIcons' }]))
			}

			updateCachedActor(actor)

			return actor
		},
		[dispatch, store, updateCachedActor, updateWorldActor, worldId],
	)

	return [perform, state] as const
}
