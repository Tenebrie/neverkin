import { BoxedWikiEntity } from '../../hooks/useBoxedWikiContent'

export const ENTITY_TYPE_LABEL: Record<BoxedWikiEntity['type'], string> = {
	actor: 'Character',
	article: 'Article',
	event: 'Event',
	tag: 'Tag',
	folder: 'Folder',
}
