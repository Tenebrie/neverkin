import ContentCopyIcon from '@mui/icons-material/ContentCopy'

import { BoxedWikiEntity } from '../../../hooks/useBoxedWikiContent'
import { WikiLintRule } from '../WikiLintRule'

export const duplicateNames: WikiLintRule = {
	id: 'duplicateNames',
	icon: <ContentCopyIcon />,
	check: (entities) => {
		const groups = new Map<string, BoxedWikiEntity[]>()
		for (const entity of entities) {
			if (entity.type === 'folder') {
				continue
			}
			const key = `${entity.type}:${entity.name.trim().toLowerCase()}`
			groups.set(key, [...(groups.get(key) ?? []), entity])
		}

		return [...groups.entries()]
			.filter(([, group]) => group.length > 1)
			.map(([key, group]) => ({
				key: `duplicateNames:${key}`,
				entity: group[0],
				label: `${group[0].name} ×${group.length}`,
				message: `${group.length} ${group[0].type}s share this name`,
				action: 'Compare',
			}))
	},
}
