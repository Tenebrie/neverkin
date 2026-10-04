import { ContentEntityType } from '@src/schema/ContentEntityType.js'
import { MindmapEntityType } from '@src/schema/EntityType.js'

import { MindmapNodeWhereInput } from '../../prisma/client/models.js'
import { ActorService } from './ActorService.js'
import { ContentService } from './ContentService.js'
import { TagService } from './TagService.js'
import { WikiArticleService } from './WikiArticleService.js'
import { WorldEventService } from './WorldEventService.js'

export const EntityResolverService = {
	resolveEntityName: async ({
		worldId,
		entityType,
		entityId,
	}: {
		worldId: string
		entityType: ContentEntityType | 'tag'
		entityId: string
	}) => {
		if (entityType === 'actor') {
			const actor = await ActorService.findActor({ worldId, actorId: entityId })
			return actor?.name ?? ''
		} else if (entityType === 'event') {
			const event = await WorldEventService.findEventById({ id: entityId, worldId })
			return event?.name ?? ''
		} else if (entityType === 'article') {
			const article = await WikiArticleService.findArticleById({ id: entityId, worldId })
			return article?.name ?? ''
		} else if (entityType === 'tag') {
			const tag = await TagService.findTag({ worldId, tagId: entityId })
			return tag?.name ?? ''
		}
		return ''
	},

	resolveEntityContent: async ({
		worldId,
		entityType,
		entityId,
	}: {
		worldId: string
		entityType: ContentEntityType
		entityId: string
	}) => {
		try {
			const entity = await ContentService.getContent({ entityType, worldId, entityId })
			return {
				contentRich: entity.contentRich,
			}
		} catch {
			return {
				contentRich: '',
			}
		}
	},

	resolveNodeParentId(entityType: MindmapEntityType, entityId: string | null) {
		const columns = {
			parentActorId: null as string | null,
			parentArticleId: null as string | null,
			parentEventId: null as string | null,
			parentFolderId: null as string | null,
			parentTagId: null as string | null,
		} satisfies MindmapNodeWhereInput
		if (entityType === 'actor') {
			columns.parentActorId = entityId
		} else if (entityType === 'article') {
			columns.parentArticleId = entityId
		} else if (entityType === 'event') {
			columns.parentEventId = entityId
		} else if (entityType === 'folder') {
			columns.parentFolderId = entityId
		} else if (entityType === 'tag') {
			columns.parentTagId = entityId
		}

		return columns
	},
}
