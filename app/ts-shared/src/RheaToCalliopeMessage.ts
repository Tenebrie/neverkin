import { ShapeOfHandlerWithSession, ShapeOfMessageWithSession } from './types.js'

export enum RheaToCalliopeMessageType {
	ANNOUNCEMENT = 'announcement',
	WORLD_UPDATED = 'worldUpdated',
	WORLD_SHARED = 'worldShared',
	WORLD_UNSHARED = 'worldUnshared',
	WORLD_EVENT_UPDATED = 'worldEventUpdated',
	WORLD_EVENTS_DELETED = 'worldEventsDeleted',
	WORLD_EVENT_DELTA_UPDATED = 'worldEventDeltaUpdated',
	WORLD_TRACKS_UPDATED = 'worldTracksUpdated',
	ACTOR_UPDATED = 'actorUpdated',
	ACTORS_DELETED = 'actorsDeleted',
	CALENDAR_UPDATED = 'calendarUpdated',
	MINDMAP_NODES_UPDATED = 'mindmapNodesUpdated',
	MINDMAP_NODES_DELETED = 'mindmapNodesDeleted',
	MINDMAP_WIRES_CREATED = 'mindmapWiresCreated',
	MINDMAP_WIRE_UPDATED = 'mindmapWireUpdated',
	MINDMAP_WIRES_DELETED = 'mindmapWiresDeleted',
	TAG_UPDATED = 'tagUpdated',
	TAGS_DELETED = 'tagsDeleted',
	WIKI_ARTICLE_UPDATED = 'wikiArticleUpdated',
	WIKI_ARTICLE_DELETED = 'wikiArticleDeleted',
	WIKI_FOLDER_UPDATED = 'wikiFolderUpdated',
	WIKI_FOLDER_DELETED = 'wikiFolderDeleted',
	WIKI_ORDER_CHANGED = 'wikiOrderChanged',
	ENTITIES_UPDATED = 'entitiesUpdated',
	DOCUMENT_RESET = 'documentReset',
	IMAGE_GENERATION_UPDATED = 'imageGenerationUpdated',
	FEATURE_FLAGS_CHANGED = 'featureFlagsChanged',
}

export type RheaToCalliopeMessagePayload = {
	[RheaToCalliopeMessageType.ANNOUNCEMENT]: {
		userId: string
	}
	[RheaToCalliopeMessageType.WORLD_UPDATED]: {
		worldId: string
		timestamp: string
	}
	[RheaToCalliopeMessageType.WORLD_SHARED]: {
		userId: string
	}
	[RheaToCalliopeMessageType.WORLD_UNSHARED]: {
		userId: string
	}
	[RheaToCalliopeMessageType.WORLD_EVENT_UPDATED]: {
		worldId: string
		// TODO: Type properly
		event: string
	}
	[RheaToCalliopeMessageType.WORLD_EVENTS_DELETED]: {
		worldId: string
	}
	[RheaToCalliopeMessageType.WORLD_EVENT_DELTA_UPDATED]: {
		worldId: string
		// TODO: Type properly
		eventDelta: string
	}
	[RheaToCalliopeMessageType.WORLD_TRACKS_UPDATED]: {
		worldId: string
		timestamp: string
	}
	[RheaToCalliopeMessageType.ACTOR_UPDATED]: {
		worldId: string
		// TODO: Type properly
		actor: string
	}
	[RheaToCalliopeMessageType.ACTORS_DELETED]: {
		worldId: string
	}
	[RheaToCalliopeMessageType.CALENDAR_UPDATED]: {
		worldId: string
		// TODO: Type properly
		calendar: string
	}
	[RheaToCalliopeMessageType.WIKI_ARTICLE_UPDATED]: {
		worldId: string
		// TODO: Type properly
		article: string
	}
	[RheaToCalliopeMessageType.WIKI_ARTICLE_DELETED]: {
		worldId: string
	}
	[RheaToCalliopeMessageType.WIKI_FOLDER_UPDATED]: {
		worldId: string
		// TODO: Type properly
		folder: string
	}
	[RheaToCalliopeMessageType.WIKI_FOLDER_DELETED]: {
		worldId: string
	}
	[RheaToCalliopeMessageType.WIKI_ORDER_CHANGED]: {
		worldId: string
		// TODO: Type properly
		updates: string // JSON stringified array of updates
	}
	[RheaToCalliopeMessageType.ENTITIES_UPDATED]: {
		worldId: string
		actorIds: string[]
		articleIds: string[]
		eventIds: string[]
		tagIds: string[]
		folderIds: string[]
		nodeIds: string[]
		patch: {
			icon?: string
			color?: string
		}
	}
	[RheaToCalliopeMessageType.MINDMAP_NODES_UPDATED]: {
		worldId: string
		// TODO: Type properly
		nodes: string // JSON stringified array of nodes
	}
	[RheaToCalliopeMessageType.MINDMAP_NODES_DELETED]: {
		worldId: string
		nodes: string[] // Node IDs
	}
	[RheaToCalliopeMessageType.MINDMAP_WIRES_CREATED]: {
		worldId: string
		// TODO: Type properly
		created: string // JSON stringified array of wires
		updated: string // JSON stringified array of wires
	}
	[RheaToCalliopeMessageType.MINDMAP_WIRE_UPDATED]: {
		worldId: string
		// TODO: Type properly
		wire: string
	}
	[RheaToCalliopeMessageType.MINDMAP_WIRES_DELETED]: {
		worldId: string
		wires: string[] // Wire IDs
	}
	[RheaToCalliopeMessageType.TAG_UPDATED]: {
		worldId: string
		// TODO: Type properly
		tag: string
	}
	[RheaToCalliopeMessageType.TAGS_DELETED]: {
		worldId: string
	}
	[RheaToCalliopeMessageType.DOCUMENT_RESET]: {
		worldId: string
		entityId: string
	}
	[RheaToCalliopeMessageType.IMAGE_GENERATION_UPDATED]: {
		userId: string
		assetId: string
		status: string
	}
	[RheaToCalliopeMessageType.FEATURE_FLAGS_CHANGED]: {
		userId: string
		flags: string[]
	}
}

export type RheaToCalliopeMessage = ShapeOfMessageWithSession<RheaToCalliopeMessagePayload>
export type RheaToCalliopeMessageHandlers = ShapeOfHandlerWithSession<RheaToCalliopeMessagePayload>
