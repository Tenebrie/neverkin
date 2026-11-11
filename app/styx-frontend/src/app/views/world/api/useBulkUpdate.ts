import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useBulkApiCache } from '@/api/hooks/useBulkApiCache'
import { BulkUpdateEntitiesApiArg, useBulkUpdateEntitiesMutation } from '@/api/worldBulkApi'
import { worldDetailsApi } from '@/api/worldDetailsApi'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { getWorldIdState } from '@/app/views/world/WorldSliceSelectors'

export function useBulkUpdate() {
	const worldId = useSelector(getWorldIdState)
	const [bulkUpdateEntities, state] = useBulkUpdateEntitiesMutation()
	const { applyEntityPatch } = useBulkApiCache()
	const dispatch = useDispatch()

	const perform = useCallback(
		async ({ entities, ...patch }: BulkUpdateEntitiesApiArg['body']) => {
			const transaction = applyEntityPatch({
				worldId,
				actorIds: entities,
				articleIds: entities,
				eventIds: entities,
				tagIds: entities,
				folderIds: entities,
				nodeIds: entities,
				patch,
			})

			const { response, error } = parseApiResponse(
				await bulkUpdateEntities({
					worldId,
					body: { entities, ...patch },
				}),
			)
			if (error) {
				transaction.undo()
				return
			}

			if (patch.icon !== undefined) {
				dispatch(worldDetailsApi.util.invalidateTags([{ type: 'worldCommonIcons' }]))
			}

			return response
		},
		[applyEntityPatch, bulkUpdateEntities, dispatch, worldId],
	)

	return [perform, state] as const
}
