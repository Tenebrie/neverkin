import { RefObject, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { preferencesSlice } from '@/app/features/preferences/PreferencesSlice'
import { getWikiPreferences } from '@/app/features/preferences/PreferencesSliceSelectors'
import { BoxedWikiEntity, useBoxedWikiContent } from '@/app/views/world/views/wiki/hooks/useBoxedWikiContent'
import { wikiSlice } from '@/app/views/world/views/wiki/WikiSlice'
import { getWikiState, getWikiStateLoaded } from '@/app/views/world/views/wiki/WikiSliceSelectors'
import { getWorldIdState, getWorldStateLoaded } from '@/app/views/world/WorldSliceSelectors'

export function useOutlinerRevealReceiver(containerRef: RefObject<HTMLElement | null>) {
	const pendingReveal = useSelector(getWikiState, (a, b) => a.pendingReveal === b.pendingReveal).pendingReveal
	const worldId = useSelector(getWorldIdState)
	const isWorldLoaded = useSelector(getWorldStateLoaded)
	const isWikiLoaded = useSelector(getWikiStateLoaded)
	const { expandedFolders } = useSelector(
		getWikiPreferences,
		(a, b) => a.expandedFolders === b.expandedFolders,
	)
	const { visibleEntities } = useBoxedWikiContent()
	const dispatch = useDispatch()

	useEffect(() => {
		if (!pendingReveal || pendingReveal.worldId !== worldId || !isWorldLoaded || !isWikiLoaded) {
			return
		}

		dispatch(wikiSlice.actions.setPendingReveal(null))
		const entity = visibleEntities.find((entity) => entity.id === pendingReveal.entityId)
		if (!entity) {
			return
		}

		let visibleRow = entity
		let folder = findParentFolder(visibleEntities, entity)
		while (folder) {
			if (!expandedFolders.includes(folder.id)) {
				dispatch(preferencesSlice.actions.uncollapseWikiFolderById(folder.id))
				visibleRow = folder
			}
			folder = findParentFolder(visibleEntities, folder)
		}
		if (entity.type === 'folder') {
			dispatch(preferencesSlice.actions.uncollapseWikiFolderById(entity.id))
		}

		const row = containerRef.current?.querySelector(`[data-entity-id="${visibleRow.id}"]`)
		row?.scrollIntoView({
			block: visibleRow.type === 'folder' ? 'start' : 'nearest',
			behavior: 'smooth',
		})
	}, [
		containerRef,
		dispatch,
		expandedFolders,
		isWikiLoaded,
		isWorldLoaded,
		pendingReveal,
		visibleEntities,
		worldId,
	])
}

function findParentFolder(entities: BoxedWikiEntity[], entity: BoxedWikiEntity) {
	return entities.find((candidate) => candidate.id === entity.entity.parentFolderId)
}
