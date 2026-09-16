import { useMemo } from 'react'

import { ListSection } from '@/ui-lib/components/ListSection/ListSection'

import { BoxedWikiEntity } from '../hooks/useBoxedWikiContent'
import { WikiLandingEntityRow } from './WikiLandingEntityRow'

const MAX_ENTRIES = 5

type Props = {
	entities: BoxedWikiEntity[]
	excluded: { entity: BoxedWikiEntity }[]
}

export function WikiLandingRecentlyChanged({ entities, excluded }: Props) {
	const recentlyChanged = useMemo(() => {
		const excludedIds = new Set(excluded.map((item) => item.entity.id))
		return entities
			.filter((entity) => entity.type !== 'folder' && !excludedIds.has(entity.id))
			.sort((a, b) => Date.parse(b.entity.updatedAt) - Date.parse(a.entity.updatedAt))
			.slice(0, MAX_ENTRIES)
	}, [entities, excluded])

	if (recentlyChanged.length === 0) {
		return null
	}

	return (
		<ListSection label="Recently changed" count={recentlyChanged.length}>
			{recentlyChanged.map((entity) => (
				<WikiLandingEntityRow key={entity.id} entity={entity} />
			))}
		</ListSection>
	)
}
