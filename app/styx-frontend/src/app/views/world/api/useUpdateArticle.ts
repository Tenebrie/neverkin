import { useCallback } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'

import { useWikiApiCache } from '@/api/hooks/useWikiApiCache'
import { UpdateArticleApiArg, useUpdateArticleMutation } from '@/api/otherApi'
import { worldDetailsApi } from '@/api/worldDetailsApi'
import { RootState } from '@/app/store'
import { parseApiResponse } from '@/app/utils/parseApiResponse'
import { getWorldIdState } from '@/app/views/world/WorldSliceSelectors'

export function useUpdateArticle() {
	const worldId = useSelector(getWorldIdState)
	const [updateArticle, state] = useUpdateArticleMutation()
	const { updateCachedArticle } = useWikiApiCache()
	const store = useStore<RootState>()

	const dispatch = useDispatch()

	const perform = useCallback(
		async (id: string, body: UpdateArticleApiArg['body']) => {
			const oldIcon = store.getState().wiki.articles.find((e) => e.id === id)?.icon

			const { response, error } = parseApiResponse(
				await updateArticle({
					worldId,
					articleId: id,
					body,
				}),
			)
			if (error) {
				return
			}

			// Invalidate common icons query cache if icon has changed
			if (body.icon !== undefined && body.icon !== oldIcon) {
				dispatch(worldDetailsApi.util.invalidateTags([{ type: 'worldCommonIcons' }]))
			}

			updateCachedArticle(response)

			return response
		},
		[dispatch, store, updateArticle, updateCachedArticle, worldId],
	)

	return [perform, state] as const
}
