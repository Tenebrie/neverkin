import { useCallback } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'

import { useWikiApiCache } from '@/api/hooks/useWikiApiCache'
import { UpdateArticleApiArg } from '@/api/otherApi'
import { worldDetailsApi } from '@/api/worldDetailsApi'
import { useUpdateFolderMutation } from '@/api/worldWikiFolderApi'
import { RootState } from '@/app/store'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { getWorldIdState } from '@/app/views/world/WorldSliceSelectors'

export function useUpdateFolder() {
	const worldId = useSelector(getWorldIdState)
	const [updateFolder, state] = useUpdateFolderMutation()
	const { updateCachedFolder } = useWikiApiCache()
	const store = useStore<RootState>()

	const dispatch = useDispatch()

	const perform = useCallback(
		async (id: string, body: UpdateArticleApiArg['body']) => {
			const oldIcon = store.getState().wiki.folders.find((e) => e.id === id)?.icon

			const diff = updateCachedFolder({ ...body, id })

			const { response, error } = parseApiResponse(
				await updateFolder({
					worldId,
					folderId: id,
					body,
				}),
			)
			if (error) {
				diff.undo()
				return
			}

			// Invalidate common icons query cache if icon has changed
			if (body.icon !== undefined && body.icon !== oldIcon) {
				dispatch(worldDetailsApi.util.invalidateTags([{ type: 'worldCommonIcons' }]))
			}

			updateCachedFolder(response)

			return response
		},
		[dispatch, store, updateFolder, updateCachedFolder, worldId],
	)

	return [perform, state] as const
}
