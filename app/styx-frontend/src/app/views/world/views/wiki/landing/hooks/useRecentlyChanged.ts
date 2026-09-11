import { useMemo } from 'react'

import { BoxedWikiEntity } from '../../hooks/useBoxedWikiContent'

const MAX_ENTRIES = 5

export function useRecentlyChanged(entities: BoxedWikiEntity[], excluded: { entity: BoxedWikiEntity }[]) {
	return useMemo(() => {
		const excludedIds = new Set(excluded.map((item) => item.entity.id))
		return entities
			.filter((entity) => entity.type !== 'folder' && !excludedIds.has(entity.id))
			.sort((a, b) => Date.parse(b.entity.updatedAt) - Date.parse(a.entity.updatedAt))
			.slice(0, MAX_ENTRIES)
	}, [entities, excluded])
}
