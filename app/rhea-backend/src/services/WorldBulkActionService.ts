import { getPrismaClient } from '@src/services/dbClients/DatabaseClient.js'

import { TransactionClient } from '../../prisma/client/internal/prismaNamespace.js'
import { makeSortWikiArticlesQuery as makeSortWikiArticlesQuery } from './dbQueries/makeSortWikiArticlesQuery.js'
import { makeTouchWorldQuery } from './dbQueries/makeTouchWorldQuery.js'

type SupportedEntityType = 'article' | 'actor' | 'event' | 'tag' | 'folder'

export const BulkActionService = {
	countWikiEntities: async ({
		worldId,
		folderId,
		prisma,
	}: {
		worldId: string
		folderId: string | null
		prisma?: TransactionClient
	}) => {
		const client = getPrismaClient(prisma)

		const counts = await Promise.all([
			client.wikiArticle.count({ where: { worldId, parentFolderId: folderId } }),
			client.wikiFolder.count({ where: { worldId, parentFolderId: folderId } }),
			client.worldEvent.count({ where: { worldId, parentFolderId: folderId } }),
			client.actor.count({ where: { worldId, parentFolderId: folderId } }),
			client.tag.count({ where: { worldId, parentFolderId: folderId } }),
		])

		return counts.reduce((acc, count) => acc + count, 0)
	},

	bulkDeleteEntities: async ({
		worldId,
		entities,
		entityTypes,
	}: {
		worldId: string
		entities: string[]
		entityTypes: SupportedEntityType[]
	}) => {
		return await getPrismaClient().$transaction(async (prisma) => {
			const articlePromise = (() => {
				if (entityTypes.includes('article')) {
					return prisma.wikiArticle.deleteMany({
						where: {
							id: { in: entities },
							worldId,
						},
					})
				}
				return null
			})()
			const actorPromise = (() => {
				if (entityTypes.includes('actor')) {
					return prisma.actor.deleteMany({
						where: {
							id: { in: entities },
							worldId,
						},
					})
				}
				return null
			})()
			const eventPromise = (() => {
				if (entityTypes.includes('event')) {
					return prisma.worldEvent.deleteMany({
						where: {
							id: { in: entities },
							worldId,
						},
					})
				}
				return null
			})()
			const tagPromise = (() => {
				if (entityTypes.includes('tag')) {
					return prisma.tag.deleteMany({
						where: {
							id: { in: entities },
							worldId,
						},
					})
				}
				return null
			})()
			const folderPromise = (() => {
				if (entityTypes.includes('folder')) {
					return prisma.wikiFolder.deleteMany({
						where: {
							id: { in: entities },
							worldId,
						},
					})
				}
				return null
			})()
			const promises = [articlePromise, actorPromise, eventPromise, tagPromise, folderPromise]

			const [articleResult, actorResult, eventResult, tagResult, folderResult] = await Promise.all(promises)

			await makeSortWikiArticlesQuery(worldId, prisma)
			const world = await makeTouchWorldQuery(worldId, prisma)

			return {
				world,
				stats: {
					articlesDeleted: articleResult?.count ?? 0,
					actorsDeleted: actorResult?.count ?? 0,
					eventsDeleted: eventResult?.count ?? 0,
					tagsDeleted: tagResult?.count ?? 0,
					foldersDeleted: folderResult?.count ?? 0,
				},
			}
		})
	},
}
