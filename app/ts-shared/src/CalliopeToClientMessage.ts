import { EmptyObject, ShapeOfHandler, ShapeOfMessage } from './types.js'

export const WORLD_UPDATE_NAME = 'worldUpdate'

export enum CalliopeToClientMessageType {
	ANNOUNCEMENT = 'announcement',
	WORLD_SHARED = 'worldShared',
	WORLD_UNSHARED = 'worldUnshared',
	WORLD_UPDATED = 'worldUpdated',
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

export type CalliopeToClientMessagePayload = {
	[CalliopeToClientMessageType.ANNOUNCEMENT]: EmptyObject
	[CalliopeToClientMessageType.WORLD_SHARED]: EmptyObject
	[CalliopeToClientMessageType.WORLD_UNSHARED]: EmptyObject

	[CalliopeToClientMessageType.WORLD_UPDATED]: {
		worldId: string
		timestamp: string
	}
	[CalliopeToClientMessageType.WORLD_EVENT_UPDATED]: {
		worldId: string
		// TODO: Type properly
		event: string
	}
	[CalliopeToClientMessageType.WORLD_EVENTS_DELETED]: {
		worldId: string
	}
	[CalliopeToClientMessageType.WORLD_EVENT_DELTA_UPDATED]: {
		worldId: string
		// TODO: Type properly
		eventDelta: string
	}
	[CalliopeToClientMessageType.WORLD_TRACKS_UPDATED]: {
		worldId: string
		timestamp: string
	}
	[CalliopeToClientMessageType.ACTOR_UPDATED]: {
		worldId: string
		// TODO: Type properly
		actor: string
	}
	[CalliopeToClientMessageType.ACTORS_DELETED]: {
		worldId: string
	}
	[CalliopeToClientMessageType.CALENDAR_UPDATED]: {
		worldId: string
		// TODO: Type properly
		calendar: string
	}

	[CalliopeToClientMessageType.WIKI_ARTICLE_UPDATED]: {
		worldId: string
		// TODO: Type properly
		article: string
	}
	[CalliopeToClientMessageType.WIKI_ARTICLE_DELETED]: {
		worldId: string
	}

	[CalliopeToClientMessageType.WIKI_FOLDER_UPDATED]: {
		worldId: string
		// TODO: Type properly
		folder: string
	}
	[CalliopeToClientMessageType.WIKI_FOLDER_DELETED]: {
		worldId: string
	}

	[CalliopeToClientMessageType.WIKI_ORDER_CHANGED]: {
		worldId: string
		// TODO: Type properly
		updates: string // JSON stringified array of updates
	}
	[CalliopeToClientMessageType.ENTITIES_UPDATED]: {
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

	[CalliopeToClientMessageType.MINDMAP_NODES_UPDATED]: {
		worldId: string
		// TODO: Type properly
		nodes: string // JSON stringified array of nodes
	}
	[CalliopeToClientMessageType.MINDMAP_NODES_DELETED]: {
		worldId: string
		nodes: string[] // Node IDs
	}
	[CalliopeToClientMessageType.MINDMAP_WIRES_CREATED]: {
		worldId: string
		// TODO: Type properly
		created: string // JSON stringified array of wires
		updated: string // JSON stringified array of wires
	}
	[CalliopeToClientMessageType.MINDMAP_WIRE_UPDATED]: {
		worldId: string
		// TODO: Type properly
		wire: string
	}
	[CalliopeToClientMessageType.MINDMAP_WIRES_DELETED]: {
		worldId: string
		wires: string[] // Wire IDs
	}
	[CalliopeToClientMessageType.TAG_UPDATED]: {
		worldId: string
		// TODO: Type properly
		tag: string
	}
	[CalliopeToClientMessageType.TAGS_DELETED]: {
		worldId: string
	}
	[CalliopeToClientMessageType.DOCUMENT_RESET]: {
		worldId: string
		entityId: string
	}
	[CalliopeToClientMessageType.IMAGE_GENERATION_UPDATED]: {
		assetId: string
		status: string
	}
	[CalliopeToClientMessageType.FEATURE_FLAGS_CHANGED]: {
		userId: string
		flags: string[]
	}
}

export type CalliopeToClientMessage = ShapeOfMessage<CalliopeToClientMessagePayload>
export type CalliopeToClientMessageHandler = ShapeOfHandler<CalliopeToClientMessagePayload>
