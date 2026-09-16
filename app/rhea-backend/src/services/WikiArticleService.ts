import { MentionedEntity, ReferenceHoldingEntity, WikiArticle } from '@prisma/client'
import { getPrismaClient } from '@src/services/dbClients/DatabaseClient.js'
import { BadRequestError } from 'moonflower'

import { AssetRefService } from './AssetRefService.js'
import { makeMoveWikiEntityQuery } from './dbQueries/makeMoveWikiEntityQuery.js'
import { makeSortWikiArticlesQuery as makeSortWikiArticlesQuery } from './dbQueries/makeSortWikiArticlesQuery.js'
import { makeTouchWorldQuery } from './dbQueries/makeTouchWorldQuery.js'
import { MentionData, MentionsService } from './MentionsService.js'
import { MentionedByEntry } from './TagService.js'
import { BulkActionService } from './WorldBulkActionService.js'

export const WikiArticleService = {
	findArticleById: async ({ id, worldId }: { id: string; worldId: string }) => {
		return getPrismaClient().wikiArticle.findFirst({
			where: {
				id,
				worldId,
			},
			include: {
				mentions: {
					distinct: ['targetId'],
					select: {
						targetId: true,
						targetType: true,
					},
				},
				mentionedIn: {
					distinct: ['sourceId'],
					select: {
						sourceId: true,
						sourceType: true,
					},
				},
				pages: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		})
	},

	findArticleByIdOrThrow: async ({ id, worldId }: { id: string; worldId: string }) => {
		const article = await WikiArticleService.findArticleById({ id, worldId })
		if (!article) {
			throw new BadRequestError('Article not found')
		}
		return article
	},

	listWikiArticles: async (params: Pick<WikiArticle, 'worldId'>) => {
		const articles = await getPrismaClient().wikiArticle.findMany({
			where: {
				worldId: params.worldId,
			},
			include: {
				pages: {
					select: {
						id: true,
						name: true,
					},
				},
				mentions: {
					distinct: ['targetId'],
					select: {
						targetId: true,
						targetType: true,
					},
				},
				mentionedIn: {
					distinct: ['sourceId'],
					select: {
						sourceId: true,
						sourceType: true,
					},
				},
			},
			orderBy: {
				parentFolderPosition: 'asc',
			},
		})

		return articles
	},

	getArticleCount: async (params: Pick<WikiArticle, 'worldId'>) => {
		return getPrismaClient().wikiArticle.count({
			where: {
				worldId: params.worldId,
			},
		})
	},

	createWikiArticle: async (
		params: Pick<WikiArticle, 'worldId' | 'name' | 'content' | 'contentRich' | 'parentFolderId'> & {
			icon?: string
			color?: string
			mentions?: MentionData[]
		},
	) => {
		return getPrismaClient().$transaction(async (prisma) => {
			const entityCount = await BulkActionService.countWikiEntities({
				worldId: params.worldId,
				folderId: params.parentFolderId,
				prisma,
			})

			const baseArticle = await prisma.wikiArticle.create({
				data: {
					worldId: params.worldId,
					name: params.name,
					icon: params.icon,
					color: params.color,
					content: params.content,
					contentRich: params.contentRich,
					parentFolderId: params.parentFolderId,
					parentFolderPosition: entityCount * 2,
				},
				select: {
					id: true,
				},
			})

			await MentionsService.createMentions(
				params.worldId,
				baseArticle.id,
				MentionedEntity.Article,
				params.mentions,
				null,
				prisma,
			)

			await makeSortWikiArticlesQuery(params.worldId, prisma)
			await makeTouchWorldQuery(params.worldId, prisma)

			const article = await prisma.wikiArticle.findFirst({
				where: {
					id: baseArticle.id,
				},
			})

			return article!
		})
	},

	updateWikiArticle: async (
		params: Partial<Pick<WikiArticle, 'name' | 'content' | 'contentRich'>> & {
			id: string
			color?: string
			worldId: string
			mentions?: MentionData[]
			referencedAssetIds?: string[]
		},
	) => {
		return getPrismaClient().$transaction(async (prisma) => {
			const previousMentions = await prisma.mention.findMany({
				where: {
					sourceArticleId: params.id,
				},
			})

			const mentionedEntities = await MentionsService.createMentions(
				params.worldId,
				params.id,
				MentionedEntity.Article,
				params.mentions,
				null,
				prisma,
			)
			await AssetRefService.createReferences({
				worldId: params.worldId,
				holderId: params.id,
				holderType: ReferenceHoldingEntity.Article,
				assets: params.referencedAssetIds,
				pageId: null,
				prisma,
			})

			const updatedArticle = await prisma.wikiArticle.update({
				where: {
					id: params.id,
					worldId: params.worldId,
				},
				data: {
					name: params.name,
					color: params.color,
					content: params.content,
					contentRich: params.contentRich,
				},
			})

			// When mentions weren't touched (mentionedEntities is undefined) nothing changed.
			const reconciledMentions = mentionedEntities ?? previousMentions
			const updatedMentions = [...previousMentions, ...reconciledMentions].filter((mention) => {
				return (
					!previousMentions.some(
						(prev) => prev.sourceId === mention.sourceId && prev.targetId === mention.targetId,
					) ||
					!reconciledMentions.some(
						(updated) => updated.sourceId === mention.sourceId && updated.targetId === mention.targetId,
					)
				)
			})

			await MentionsService.clearOrphanedMentions(prisma)
			await AssetRefService.clearOrphanedReferences(prisma)
			await makeTouchWorldQuery(updatedArticle.worldId, prisma)

			return { article: updatedArticle, updatedMentions }
		})
	},

	moveWikiArticle: async (params: {
		worldId: string
		entityId: string
		toPosition: number
		toParentId?: string | null
	}) => {
		return getPrismaClient().$transaction(async (prisma) => {
			const { type } = await makeMoveWikiEntityQuery(params, prisma)
			const updates = await makeSortWikiArticlesQuery(params.worldId, prisma)
			const world = await makeTouchWorldQuery(params.worldId, prisma)

			if (params.toParentId !== undefined) {
				updates.unshift({
					entityId: params.entityId,
					entityType: type,
					position: params.toPosition,
					folderId: params.toParentId,
				})
			}

			return { world, updates }
		})
	},

	bulkMoveWikiEntities: async (params: {
		worldId: string
		entityIds: string[]
		toPosition: number
		toParentId?: string | null
	}) => {
		return getPrismaClient().$transaction(async (prisma) => {
			const promises = params.entityIds.map((id, index) => {
				return makeMoveWikiEntityQuery(
					{
						worldId: params.worldId,
						entityId: id,
						toParentId: params.toParentId,
						toPosition: params.toPosition + index / params.entityIds.length,
					},
					prisma,
				)
			})
			const results = await Promise.all(promises)

			const updates = await makeSortWikiArticlesQuery(params.worldId, prisma)
			const world = await makeTouchWorldQuery(params.worldId, prisma)

			if (params.toParentId !== undefined) {
				results.forEach((entity) => {
					updates.unshift({
						entityId: entity.id,
						entityType: entity.type,
						position: params.toPosition,
						folderId: params.toParentId,
					})
				})
			}

			return { world, updates }
		})
	},

	deleteWikiArticle: async ({ worldId, articleId }: { worldId: string; articleId: string }) => {
		return await getPrismaClient().$transaction(async (prisma) => {
			await prisma.wikiArticle.delete({
				where: {
					id: articleId,
				},
			})

			const updatedMentions = await prisma.mention.findMany({
				where: { sourceArticleId: articleId },
			})

			await makeSortWikiArticlesQuery(worldId, prisma)
			const world = await makeTouchWorldQuery(worldId, prisma)

			return {
				world,
				updatedMentions,
			}
		})
	},

	findArticleBacklinks: async ({ worldId, articleId }: { worldId: string; articleId: string }) => {
		const article = await getPrismaClient().wikiArticle.findFirst({
			where: { id: articleId, worldId },
			include: {
				mentionedIn: {
					distinct: ['sourceId'],
					include: {
						sourceActor: {
							select: { id: true, name: true },
						},
						sourceEvent: {
							select: { id: true, name: true },
						},
						sourceArticle: {
							select: { id: true, name: true },
						},
						sourceTag: {
							select: { id: true, name: true },
						},
					},
				},
			},
		})

		if (!article) {
			return null
		}

		const mentionedBy: MentionedByEntry[] = article.mentionedIn.map((mention) => {
			const source = mention.sourceActor ?? mention.sourceEvent ?? mention.sourceArticle ?? mention.sourceTag
			return {
				type: mention.sourceType,
				id: source?.id ?? mention.sourceId,
				name: source?.name ?? 'Unknown',
			}
		})

		return mentionedBy
	},
}
