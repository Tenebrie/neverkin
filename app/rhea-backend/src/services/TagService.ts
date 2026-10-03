import { MentionedEntity } from '@prisma/client'

import { TagUncheckedCreateInput, TagUncheckedUpdateInput } from '../../prisma/client/models.js'
import { getPrismaClient } from './dbClients/DatabaseClient.js'
import { makeSortWikiArticlesQuery } from './dbQueries/makeSortWikiArticlesQuery.js'
import { makeTouchWorldQuery } from './dbQueries/makeTouchWorldQuery.js'
import { CommonOrderBy } from './utils/commonOrderBy.js'
import { BulkActionService } from './WorldBulkActionService.js'

export type MentionedByEntry = {
	type: MentionedEntity
	id: string
	name: string
}

export const TagService = {
	findTag: async ({ worldId, tagId }: { worldId: string; tagId: string | null | undefined }) => {
		if (!tagId) {
			return null
		}
		return getPrismaClient().tag.findUnique({
			where: { id: tagId, worldId },
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
			},
		})
	},

	findTagOrThrow: async ({ worldId, tagId }: { worldId: string; tagId: string }) => {
		const tag = await TagService.findTag({ worldId, tagId })
		if (!tag) {
			throw new Error(`Tag not found: ${tagId}`)
		}
		return tag
	},

	findTagWithMentions: async ({ worldId, tagId }: { worldId: string; tagId: string }) => {
		const tag = await getPrismaClient().tag.findUnique({
			where: { id: tagId, worldId },
			include: {
				mentions: { distinct: ['targetId'] },
				mentionedIn: {
					distinct: ['sourceId'],
					include: {
						sourceActor: {
							select: {
								id: true,
								name: true,
							},
						},
						sourceEvent: {
							select: {
								id: true,
								name: true,
							},
						},
						sourceArticle: {
							select: {
								id: true,
								name: true,
							},
						},
						sourceTag: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		})

		if (!tag) {
			return null
		}

		const mentionedBy: MentionedByEntry[] = tag.mentionedIn.map((mention) => {
			const source = mention.sourceActor ?? mention.sourceEvent ?? mention.sourceArticle ?? mention.sourceTag
			return {
				type: mention.sourceType,
				id: source?.id ?? mention.sourceId,
				name: source?.name ?? 'Unknown',
			}
		})

		return {
			...tag,
			mentionedIn: undefined,
			mentionedBy,
		}
	},

	listTagsForWorld: async (worldId: string) => {
		return getPrismaClient().tag.findMany({
			where: { worldId },
			include: {
				mentions: { distinct: ['targetId'], orderBy: { targetId: 'asc' } },
				mentionedIn: { distinct: ['sourceId'], orderBy: { sourceId: 'asc' } },
			},
			orderBy: CommonOrderBy,
		})
	},

	createTag: async ({
		worldId,
		params,
	}: {
		worldId: string
		params: Omit<TagUncheckedCreateInput, 'worldId'>
	}) => {
		return getPrismaClient().$transaction(async (prisma) => {
			const entityCount = await BulkActionService.countWikiEntities({
				worldId,
				folderId: params.parentFolderId ?? null,
				prisma,
			})

			const baseTag = await getPrismaClient(prisma).tag.create({
				data: {
					worldId,
					...params,
					description: params.description ?? '',
					parentFolderPosition: entityCount * 2,
				},
				select: {
					id: true,
				},
			})

			const world = await makeTouchWorldQuery(worldId, prisma)
			await makeSortWikiArticlesQuery(worldId, prisma)

			const tag = await getPrismaClient(prisma).tag.findFirst({
				where: {
					id: baseTag.id,
				},
				include: {
					mentions: { distinct: ['targetId'] },
					mentionedIn: { distinct: ['sourceId'] },
				},
			})!

			return {
				world,
				tag,
			}
		})
	},

	updateTag: async ({
		worldId,
		tagId,
		params,
	}: {
		worldId: string
		tagId: string
		params: Pick<TagUncheckedUpdateInput, 'name' | 'description' | 'color'>
	}) => {
		return getPrismaClient().$transaction(async (prisma) => {
			const tag = await getPrismaClient(prisma).tag.update({
				where: { id: tagId, worldId },
				data: {
					name: params.name,
					description: params.description,
					color: params.color,
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
				},
			})

			const world = await makeTouchWorldQuery(worldId, prisma)

			return {
				world,
				tag,
			}
		})
	},

	deleteTag: async ({ worldId, tagId }: { worldId: string; tagId: string }) => {
		const [tag, world] = await getPrismaClient().$transaction([
			getPrismaClient().tag.delete({
				where: { id: tagId, worldId },
			}),
			makeTouchWorldQuery(worldId),
		])
		return {
			tag,
			world,
		}
	},
}
