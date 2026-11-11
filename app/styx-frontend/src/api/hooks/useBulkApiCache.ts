import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { mindmapApi } from '@/api/mindmapApi'
import { worldDetailsApi } from '@/api/worldDetailsApi'
import { worldWikiApi } from '@/api/worldWikiApi'
import { worldWikiFolderApi } from '@/api/worldWikiFolderApi'
import { AppDispatch } from '@/app/store'
import { getWorldIdState } from '@/app/views/world/WorldSliceSelectors'
import {
	CalliopeToClientMessagePayload,
	CalliopeToClientMessageType,
} from '@/ts-shared/CalliopeToClientMessage'

export function useBulkApiCache() {
	const dispatch = useDispatch<AppDispatch>()
	const worldId = useSelector(getWorldIdState)

	const applyEntityPatch = useCallback(
		({
			actorIds,
			articleIds,
			eventIds,
			tagIds,
			folderIds,
			nodeIds,
			patch,
		}: CalliopeToClientMessagePayload[CalliopeToClientMessageType.ENTITIES_UPDATED]) => {
			function patchMatching(
				entities: {
					id: string
					icon: string
					color: string
				}[],
				ids: string[],
			) {
				entities.filter((entity) => ids.includes(entity.id)).forEach((entity) => Object.assign(entity, patch))
			}

			const undoTransactions: (() => void)[] = []

			if (articleIds.length > 0) {
				const articleDispatch = dispatch(
					worldWikiApi.util.updateQueryData('getArticles', { worldId }, (draft) => {
						patchMatching(draft, articleIds)
					}),
				)
				undoTransactions.push(articleDispatch.undo)
			}

			if (folderIds.length > 0) {
				const folderDispatch = dispatch(
					worldWikiFolderApi.util.updateQueryData('getFolders', { worldId }, (draft) => {
						patchMatching(draft, folderIds)
					}),
				)
				undoTransactions.push(folderDispatch.undo)
			}

			if (actorIds.length > 0 || eventIds.length > 0 || tagIds.length > 0) {
				const worldTransaction = dispatch(
					worldDetailsApi.util.updateQueryData('getWorldInfo', { worldId }, (draft) => {
						patchMatching(draft.actors, actorIds)
						patchMatching(draft.events, eventIds)
						patchMatching(draft.tags, tagIds)
					}),
				)
				undoTransactions.push(worldTransaction.undo)
			}

			if (nodeIds.length > 0) {
				const nodeDispatch = dispatch(
					mindmapApi.util.updateQueryData('getMindmap', { worldId }, (draft) => {
						patchMatching(draft.nodes, nodeIds)
					}),
				)
				undoTransactions.push(nodeDispatch.undo)
			}

			return {
				undo: () => {
					undoTransactions.forEach((undo) => undo())
				},
			}
		},
		[dispatch, worldId],
	)

	return {
		applyEntityPatch,
	}
}
