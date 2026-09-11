import EditNoteIcon from '@mui/icons-material/EditNote'

import { ENTITY_TYPE_LABEL } from '../../utils/entityTypeLabel'
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
				message: `${ENTITY_TYPE_LABEL[entity.type].toLowerCase()} is still empty`,
				action: 'Write it',
			})),
}
