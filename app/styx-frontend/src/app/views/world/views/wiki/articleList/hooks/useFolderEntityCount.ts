import { shallowEqual, useSelector } from 'react-redux'

import { WikiEntityType } from '@/api/types/worldTypes'
import { getWikiPreferences } from '@/app/features/preferences/PreferencesSliceSelectors'
import { RootState } from '@/app/store'

import { getWikiFolderCounts } from '../../WikiSliceSelectors'

type Props = {
	id: string
	entityType: WikiEntityType | 'node'
}

export function useFolderEntityCount({ id, entityType }: Props) {
	const { visibleEntities } = useSelector(
		getWikiPreferences,
		(a, b) => a.visibleEntities === b.visibleEntities,
	)

	return useSelector((state: RootState) => {
		if (entityType !== 'folder') {
			return {
				visible: 0,
				total: 0,
				formatted: null,
			}
		}
		const counts = getWikiFolderCounts(state).get(id)
		if (counts === undefined) {
			return {
				visible: 0,
				total: 0,
				formatted: '0',
			}
		}

		const visible = visibleEntities.map((type) => counts[type] ?? 0).reduce((acc, val) => acc + val, 0)
		if (visible === counts.total) {
			return {
				visible,
				total: counts.total,
				formatted: String(visible),
			}
		}

		return {
			visible,
			total: counts.total,
			formatted: `${visible} / ${counts.total}`,
		}
	}, shallowEqual)
}
