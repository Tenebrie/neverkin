import {
	Actor,
	Calendar,
	Mention,
	MindmapLink,
	MindmapNode,
	User,
	WikiArticle,
	WikiFolder,
	WorldEvent,
	WorldEventDelta,
} from '@prisma/client'
import { RedisChannel } from '@src/ts-shared/RedisChannel.js'
import { ParameterizedContext } from 'koa'

import {
	RheaToCalliopeMessage,
	RheaToCalliopeMessagePayload,
	RheaToCalliopeMessageType,
} from '../ts-shared/RheaToCalliopeMessage.js'
import { getRedisClient, openRedisChannel } from './dbClients/RedisClient.js'
import { WikiPositionUpdate } from './dbQueries/makeSortWikiArticlesQuery.js'
import { TagService } from './TagService.js'
import { BaselineTag } from './types.js'

const calliope = openRedisChannel<RheaToCalliopeMessage>(RedisChannel.RHEA_TO_CALLIOPE)

type ContextWithSessionId = ParameterizedContext & { sessionId: string | undefined }

export const RedisService = {
	initRedisConnection: async () => {
		await getRedisClient().connect()
	},

	notifyAboutNewAnnouncement: ({ userId }: { userId: string }) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.ANNOUNCEMENT,
			messageSourceSessionId: undefined,
			data: {
				userId,
			},
		})
	},

	notifyAboutWorldUpdate: (
		ctx: ContextWithSessionId,
		{ worldId, timestamp }: { worldId: string; timestamp: Date },
	) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.WORLD_UPDATED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
				timestamp: timestamp.toISOString(),
			},
		})
	},

	notifyAboutWorldEventUpdate: (
		ctx: ContextWithSessionId,
		{ worldId, event }: { worldId: string; event: WorldEvent },
	) => {
		const eventToSend = {
			...event,
			contentRich: undefined,
		}
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.WORLD_EVENT_UPDATED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
				event: JSON.stringify(eventToSend, (_, value) =>
					typeof value === 'bigint' ? value.toString() : value,
				),
			},
		})
	},

	notifyAboutWorldEventsDelete: (ctx: ContextWithSessionId, { worldId }: { worldId: string }) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.WORLD_EVENTS_DELETED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
			},
		})
	},

	notifyAboutUpdatedMentions: (
		ctx: ContextWithSessionId,
		{ worldId, mentions }: { worldId: string; mentions: Mention[] },
	) => {
		mentions
			.filter((mention) => mention.targetType === 'Tag')
			.forEach(async (mention) => {
				RedisService.notifyAboutTagUpdate(ctx, {
					worldId,
					tag: await TagService.findTagOrThrow({ worldId, tagId: mention.targetId }),
				})
			})
	},

	notifyAboutWorldEventDeltaUpdate: (
		ctx: ContextWithSessionId,
		{ worldId, delta }: { worldId: string; delta: WorldEventDelta },
	) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.WORLD_EVENT_DELTA_UPDATED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
				eventDelta: JSON.stringify(delta, (_, value) =>
					typeof value === 'bigint' ? value.toString() : value,
				),
			},
		})
	},

	notifyAboutActorUpdate: (
		ctx: ContextWithSessionId,
		{ worldId, actor }: { worldId: string; actor: Actor },
	) => {
		const actorToSend = {
			...actor,
			contentRich: undefined,
		}
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.ACTOR_UPDATED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
				actor: JSON.stringify(actorToSend),
			},
		})
	},

	notifyAboutActorsDelete: (ctx: ContextWithSessionId, { worldId }: { worldId: string }) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.ACTORS_DELETED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
			},
		})
	},

	notifyAboutCalendarUpdate: (
		ctx: ContextWithSessionId,
		{ worldId, calendar }: { worldId: string; calendar: Calendar },
	) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.CALENDAR_UPDATED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
				calendar: JSON.stringify(calendar),
			},
		})
	},

	notifyAboutMindmapNodesUpdate: (
		ctx: ContextWithSessionId,
		{ worldId, nodes }: { worldId: string; nodes: MindmapNode[] },
	) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.MINDMAP_NODES_UPDATED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
				nodes: JSON.stringify(nodes),
			},
		})
	},

	notifyAboutMindmapNodesDelete: (
		ctx: ContextWithSessionId,
		{ worldId, nodes }: { worldId: string; nodes: string[] },
	) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.MINDMAP_NODES_DELETED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
				nodes,
			},
		})
	},

	notifyAboutMindmapWiresCreate: (
		ctx: ContextWithSessionId,
		{ worldId, created, updated }: { worldId: string; created: MindmapLink[]; updated: MindmapLink[] },
	) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.MINDMAP_WIRES_CREATED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
				created: JSON.stringify(created),
				updated: JSON.stringify(updated),
			},
		})
	},

	notifyAboutMindmapWireUpdate: (
		ctx: ContextWithSessionId,
		{ worldId, wire }: { worldId: string; wire: MindmapLink },
	) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.MINDMAP_WIRE_UPDATED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
				wire: JSON.stringify(wire),
			},
		})
	},

	notifyAboutMindmapWiresDelete: (
		ctx: ContextWithSessionId,
		{ worldId, wires }: { worldId: string; wires: string[] },
	) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.MINDMAP_WIRES_DELETED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
				wires,
			},
		})
	},

	notifyAboutTagUpdate: (
		ctx: ContextWithSessionId,
		{ worldId, tag }: { worldId: string; tag: BaselineTag },
	) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.TAG_UPDATED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
				tag: JSON.stringify(tag),
			},
		})
	},

	notifyAboutTagsDelete: (ctx: ContextWithSessionId, { worldId }: { worldId: string }) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.TAGS_DELETED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
			},
		})
	},

	notifyAboutWorldTracksUpdate: (
		ctx: ContextWithSessionId,
		{ worldId, timestamp }: { worldId: string; timestamp: Date },
	) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.WORLD_TRACKS_UPDATED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
				timestamp: timestamp.toISOString(),
			},
		})
	},

	notifyAboutWorldShared: (ctx: ContextWithSessionId, { users }: { users: User[] }) => {
		users.forEach((user) => {
			calliope.sendMessage({
				type: RheaToCalliopeMessageType.WORLD_SHARED,
				messageSourceSessionId: ctx.sessionId,
				data: {
					userId: user.id,
				},
			})
		})
	},

	notifyAboutWorldUnshared: (ctx: ContextWithSessionId, { userId }: { userId: string }) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.WORLD_UNSHARED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				userId,
			},
		})
	},

	notifyAboutWikiArticleUpdate: (
		ctx: ContextWithSessionId,
		{ worldId, article }: { worldId: string; article: WikiArticle },
	) => {
		const articleToSend = {
			...article,
			contentRich: undefined,
		}
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.WIKI_ARTICLE_UPDATED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
				article: JSON.stringify(articleToSend),
			},
		})
	},

	notifyAboutWikiArticlesDelete: (ctx: ContextWithSessionId, { worldId }: { worldId: string }) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.WIKI_ARTICLE_DELETED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
			},
		})
	},

	notifyAboutWikiFolderUpdate: (
		ctx: ContextWithSessionId,
		{ worldId, folder }: { worldId: string; folder: WikiFolder },
	) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.WIKI_FOLDER_UPDATED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
				folder: JSON.stringify(folder),
			},
		})
	},

	notifyAboutWikiFoldersDelete: (ctx: ContextWithSessionId, { worldId }: { worldId: string }) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.WIKI_FOLDER_DELETED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
			},
		})
	},

	notifyAboutWikiReorder: (
		ctx: ContextWithSessionId,
		{ worldId, updates }: { worldId: string; updates: WikiPositionUpdate[] },
	) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.WIKI_ORDER_CHANGED,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
				updates: JSON.stringify(updates),
			},
		})
	},

	notifyAboutEntitiesUpdate: (
		ctx: ContextWithSessionId,
		data: RheaToCalliopeMessagePayload[RheaToCalliopeMessageType.ENTITIES_UPDATED],
	) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.ENTITIES_UPDATED,
			messageSourceSessionId: ctx.sessionId,
			data,
		})
	},

	notifyAboutDocumentReset: (
		ctx: ContextWithSessionId,
		{ worldId, entityId }: { worldId: string; entityId: string },
	) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.DOCUMENT_RESET,
			messageSourceSessionId: ctx.sessionId,
			data: {
				worldId,
				entityId,
			},
		})
	},

	notifyAboutImageGeneration: ({
		userId,
		assetId,
		status,
	}: {
		userId: string
		assetId: string
		status: string
	}) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.IMAGE_GENERATION_UPDATED,
			messageSourceSessionId: undefined,
			data: {
				userId,
				assetId,
				status,
			},
		})
	},

	notifyAboutFeatureFlags: ({ userId, flags }: { userId: string; flags: string[] }) => {
		calliope.sendMessage({
			type: RheaToCalliopeMessageType.FEATURE_FLAGS_CHANGED,
			messageSourceSessionId: undefined,
			data: {
				userId,
				flags,
			},
		})
	},
}
