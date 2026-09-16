import EditNoteIcon from '@mui/icons-material/EditNote'

import { getEntityExcerpt } from '../../utils/getEntityExcerpt'
import { WikiLintRule } from '../WikiLintRule'

export const emptyContent: WikiLintRule = {
	id: 'emptyContent',
	icon: <EditNoteIcon />,
	check: (entities) =>
		entities
			.filter((entity) => entity.type !== 'folder' && entity.type !== 'tag' && !getEntityExcerpt(entity))
			.map((entity) => ({
				key: `emptyContent:${entity.id}`,
				entity,
				label: entity.name,
				message: `${entity.type} is still empty`,
				action: 'Write it',
			})),
}
