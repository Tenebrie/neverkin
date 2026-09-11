import { BoxedWikiEntity } from '../../hooks/useBoxedWikiContent'

export function getEntityExcerpt(entity: BoxedWikiEntity): string {
	switch (entity.type) {
		case 'tag':
			return entity.entity.description.trim()
		case 'folder':
			return ''
		default:
			return entity.entity.content.trim()
	}
}
