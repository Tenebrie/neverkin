import { useCallback } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'

import { WorldEvent } from '@/api/types/worldTypes'
import { worldDetailsApi } from '@/api/worldDetailsApi'
import { UpdateWorldEventApiArg, useUpdateWorldEventMutation } from '@/api/worldEventApi'
import { RootState } from '@/app/store'
import { ingestEvent } from '@/app/utils/ingestEntity'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { worldSlice } from '@/app/views/world/WorldSlice'
import { getWorldIdState } from '@/app/views/world/WorldSliceSelectors'

export const useUpdateEvent = () => {
	const worldId = useSelector(getWorldIdState)
	const [updateWorldEvent, state] = useUpdateWorldEventMutation()
	const store = useStore<RootState>()

	const { updateEvent } = worldSlice.actions
	const dispatch = useDispatch()

	const perform = useCallback(
		async (id: string, body: UpdateWorldEventApiArg['body'], onBeforeSave?: (event: WorldEvent) => void) => {
			const oldIcon = store.getState().world.events.find((e) => e.id === id)?.icon

			const { response, error } = parseApiResponse(
				await updateWorldEvent({
					worldId,
					eventId: id,
					body,
				}),
			)
			if (error) {
				return
			}

			const event = ingestEvent(response)
			onBeforeSave?.(event)

			// Invalidate common icons query cache if icon has changed
			if (body.icon !== undefined && body.icon !== oldIcon) {
				dispatch(worldDetailsApi.util.invalidateTags([{ type: 'worldCommonIcons' }]))
			}

			dispatch(updateEvent(event))

			return event
		},
		[dispatch, store, updateEvent, updateWorldEvent, worldId],
	)

	return [perform, state] as const
}
