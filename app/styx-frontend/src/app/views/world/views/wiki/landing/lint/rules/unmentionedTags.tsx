import LinkOffIcon from '@mui/icons-material/LinkOff'

import { WikiLintRule } from '../WikiLintRule'

export const unmentionedTags: WikiLintRule = {
	id: 'unmentionedTags',
	icon: <LinkOffIcon />,
	check: (entities) =>
		entities
			.filter((entity) => entity.type === 'tag' && entity.entity.mentionedIn.length === 0)
			.map((entity) => ({
				key: `unmentionedTags:${entity.id}`,
				entity,
				label: entity.name,
				message: 'tag with no mentions anywhere in the world',
				action: 'Find a home',
			})),
}
