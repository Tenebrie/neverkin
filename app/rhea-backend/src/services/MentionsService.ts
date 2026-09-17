import { Mention, MentionedEntity, Prisma } from '@prisma/client'

import { getPrismaClient } from './dbClients/DatabaseClient.js'

export type MentionData = Pick<Mention, 'targetId' | 'targetType'>

export const MentionsService = {
	createMentions: async (
		worldId: string,
		sourceId: string,
		sourceType: MentionedEntity,
		mentions: MentionData[] | undefined,
		pageId: string | null,
		prisma?: Prisma.TransactionClient,
	): Promise<Mention[] | undefined> => {
		if (!mentions) {
			return undefined
		}

		const client = getPrismaClient(prisma)

		const sourceColumn = mentionSourceColumn(sourceType, sourceId)

		const data = dedupeMentions(
			mentions.map((mention) => ({
				sourceId: sourceId,
				sourceType: sourceType,

				targetId: mention.targetId,
				targetType: mention.targetType,

				pageId: pageId,

				...sourceColumn,

				targetActorId: mention.targetType === MentionedEntity.Actor ? mention.targetId : undefined,
				targetEventId: mention.targetType === MentionedEntity.Event ? mention.targetId : undefined,
				targetArticleId: mention.targetType === MentionedEntity.Article ? mention.targetId : undefined,
				targetTagId: mention.targetType === MentionedEntity.Tag ? mention.targetId : undefined,
			})),
		)

		const dataWithWorldIds = await Promise.all(
			data.map(async (mention) => ({
				...mention,
				sourceWorldId: await getEntityWorldId(mention.sourceId, mention.sourceType, prisma),
				targetWorldId: await getEntityWorldId(mention.targetId, mention.targetType, prisma),
			})),
		)

		const filteredData = dataWithWorldIds.filter(
			(mention) => mention.sourceWorldId === worldId && mention.targetWorldId === worldId,
		)

		await client.mention.deleteMany({
			where: {
				...sourceColumn,
				pageId,
			},
		})

		if (filteredData.length > 0) {
			await client.mention.createMany({
				data: filteredData.map((data) => ({
					...data,
					sourceWorldId: undefined,
					targetWorldId: undefined,
				})),
				skipDuplicates: true,
			})
		}

		const allMentions = await client.mention.findMany({
			where: sourceColumn,
		})

		return dedupeMentions(allMentions)
	},

	clearOrphanedMentions: async (transaction?: Prisma.TransactionClient) => {
		await (transaction ?? getPrismaClient()).mention.deleteMany({
			where: {
				OR: [
					{
						sourceArticleId: null,
						sourceEventId: null,
						sourceTagId: null,
						sourceActorId: null,
						sourceNodeId: null,
					},
					{
						targetArticleId: null,
						targetEventId: null,
						targetTagId: null,
						targetActorId: null,
					},
				],
			},
		})
	},
}

function mentionSourceColumn(sourceType: MentionedEntity, sourceId: string) {
	const columns = {
		[MentionedEntity.Actor]: { sourceActorId: sourceId },
		[MentionedEntity.Event]: { sourceEventId: sourceId },
		[MentionedEntity.Article]: { sourceArticleId: sourceId },
		[MentionedEntity.Tag]: { sourceTagId: sourceId },
		[MentionedEntity.Node]: { sourceNodeId: sourceId },
	} satisfies Record<MentionedEntity, Prisma.MentionWhereInput>

	return columns[sourceType]
}

export function dedupeMentions<T extends Pick<Mention, 'sourceId' | 'targetId'>>(mentions: T[]): T[] {
	const unique = new Map<string, T>()
	for (const mention of mentions) {
		unique.set(`${mention.sourceId}->${mention.targetId}`, mention)
	}
	return Array.from(unique.values())
}

async function getEntityWorldId(
	entityId: string,
	entityType: MentionedEntity,
	prisma?: Prisma.TransactionClient,
) {
	const client = getPrismaClient(prisma)
	switch (entityType) {
		case MentionedEntity.Actor:
			return (await client.actor.findUnique({ where: { id: entityId } }))?.worldId
		case MentionedEntity.Event:
			return (await client.worldEvent.findUnique({ where: { id: entityId } }))?.worldId
		case MentionedEntity.Article:
			return (await client.wikiArticle.findUnique({ where: { id: entityId } }))?.worldId
		case MentionedEntity.Tag:
			return (await client.tag.findUnique({ where: { id: entityId } }))?.worldId
		case MentionedEntity.Node:
			return (await client.mindmapNode.findUnique({ where: { id: entityId } }))?.worldId
	}
}
