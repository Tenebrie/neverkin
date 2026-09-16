import { useMemo } from 'react'

import { BoxedWikiEntity } from '../../hooks/useBoxedWikiContent'
import { useRecentlyOpened } from './useRecentlyOpened'

const MAX_RECENTLY_OPENED = 5

export function useRecentlyOpenedEntities(entities: BoxedWikiEntity[]) {
	const { entries } = useRecentlyOpened()

	return useMemo(() => {
		const entitiesById = new Map(entities.map((entity) => [entity.id, entity]))
		const shown = entries
			.flatMap((entry) => {
				const entity = entitiesById.get(entry.entityId)
				return entity ? [{ entity, openedAt: entry.openedAt }] : []
			})
			.slice(0, MAX_RECENTLY_OPENED)

		const [lead, ...alsoOpened] = shown
		return { lead, alsoOpened, shown }
	}, [entries, entities])
}
