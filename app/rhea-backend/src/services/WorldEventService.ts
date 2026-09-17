import { Prisma } from '@prisma/client'

import { getPrismaClient } from './dbClients/DatabaseClient.js'
import { fetchWorldEventDetailsOrThrow } from './dbQueries/fetchWorldEventDetailsOrThrow.js'
import { fetchWorldEventOrThrow } from './dbQueries/fetchWorldEventOrThrow.js'
import { makeSortWikiArticlesQuery } from './dbQueries/makeSortWikiArticlesQuery.js'
import { makeTouchWorldQuery } from './dbQueries/makeTouchWorldQuery.js'
import {
	makeUpdateWorldEventQuery,
	UpdateWorldEventQueryParams,
} from './dbQueries/makeUpdateWorldEventQuery.js'
import { MentionedByEntry } from './TagService.js'
import { BulkActionService } from './WorldBulkActionService.js'

export const WorldEventService = {
	findEventById: async ({ id, worldId }: { id: string; worldId: string }) => {
		return getPrismaClient().worldEvent.findFirst({
			where: {
				id,
				worldId,
			},
		})
	},

	fetchWorldEvent: async (eventId: string) => {
		return await fetchWorldEventOrThrow(eventId)
	},

	fetchWorldEventWithDetails: async (eventId: string) => {
		return fetchWorldEventDetailsOrThrow(eventId)
	},

	createWorldEvent: async ({
		worldId,
		createData,
		updateData,
	}: {
		worldId: string
		createData: Omit<Prisma.WorldEventUncheckedCreateInput, 'worldId'>
		updateData: UpdateWorldEventQueryParams
	}) => {
		return getPrismaClient().$transaction(async (prisma) => {
			const entityCount = await BulkActionService.countWikiEntities({
				worldId,
				folderId: createData.parentFolderId ?? null,
				prisma,
			})

			const baseEvent = await prisma.worldEvent.create({
				data: {
					worldId,
					parentFolderPosition: entityCount * 2,
					...createData,
				},
				select: {
					id: true,
				},
			})

			await makeUpdateWorldEventQuery({
				worldId,
				eventId: baseEvent.id,
				params: updateData,
				prisma,
			})

			const world = await makeTouchWorldQuery(worldId, prisma)
			await makeSortWikiArticlesQuery(worldId, prisma)

			const event = await fetchWorldEventDetailsOrThrow(baseEvent.id, prisma)

			return {
				world,
				event,
			}
		})
	},

	updateWorldEvent: async ({
		worldId,
		eventId,
		params,
	}: {
		worldId: string
		eventId: string
		params: UpdateWorldEventQueryParams
	}) => {
		return getPrismaClient().$transaction(async (prisma) => {
			const previousMentions = await prisma.mention.findMany({
				where: {
					sourceEventId: eventId,
				},
			})

			await makeUpdateWorldEventQuery({
				worldId,
				eventId,
				params,
				prisma,
			})

			const currentMentions = await prisma.mention.findMany({
				where: {
					sourceEventId: eventId,
				},
			})

			const world = await makeTouchWorldQuery(worldId, prisma)
			const event = await fetchWorldEventDetailsOrThrow(eventId, prisma)

			const updatedMentions = [...previousMentions, ...currentMentions].filter((mention) => {
				return (
					!previousMentions.some(
						(prev) => prev.sourceId === mention.sourceId && prev.targetId === mention.targetId,
					) ||
					!currentMentions.some(
						(updated) => updated.sourceId === mention.sourceId && updated.targetId === mention.targetId,
					)
				)
			})

			return {
				world,
				event,
				updatedMentions,
			}
		})
	},

	deleteWorldEvent: async ({ worldId, eventId }: { worldId: string; eventId: string }) => {
		const [event, world] = await getPrismaClient().$transaction([
			getPrismaClient().worldEvent.deleteMany({
				where: {
					id: eventId,
					worldId,
				},
			}),
			makeTouchWorldQuery(worldId),
		])
		return {
			event,
			world,
		}
	},

	revokeWorldEvent: async ({
		worldId,
		eventId,
		revokedAt,
	}: {
		worldId: string
		eventId: string
		revokedAt: bigint
	}) => {
		const [statement, world] = await getPrismaClient().$transaction([
			getPrismaClient().worldEvent.update({
				where: {
					id: eventId,
				},
				data: {
					revokedAt,
				},
			}),
			makeTouchWorldQuery(worldId),
		])
		return {
			statement,
			world,
		}
	},

	unrevokeWorldEvent: async ({ worldId, eventId }: { worldId: string; eventId: string }) => {
		const [statement, world] = await getPrismaClient().$transaction([
			getPrismaClient().worldEvent.update({
				where: {
					id: eventId,
				},
				data: {
					revokedAt: null,
				},
			}),
			makeTouchWorldQuery(worldId),
		])
		return {
			statement,
			world,
		}
	},

	findEventBacklinks: async ({ worldId, eventId }: { worldId: string; eventId: string }) => {
		const event = await getPrismaClient().worldEvent.findUnique({
			where: { id: eventId, worldId },
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

		if (!event) {
			return null
		}

		const mentionedBy: MentionedByEntry[] = event.mentionedIn.map((mention) => {
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
