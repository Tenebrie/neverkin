import { useSelector } from 'react-redux'

import { useGetMindmapQuery } from '@/api/mindmapApi'
import { MindmapNode } from '@/api/types/mindmapTypes'
import { Actor, WorldEvent, WorldTag } from '@/api/types/worldTypes'
import { WikiArticle, WikiFolder } from '@/api/types/worldWikiTypes'
import { store } from '@/app/store'
import { getWorldState } from '@/app/views/world/WorldSliceSelectors'

type ResolvedMention =
	| {
			type: 'event'
			entity: WorldEvent
			node?: MindmapNode
	  }
	| {
			type: 'node'
			entity: MindmapNode
			node?: MindmapNode
	  }
	| {
			type: 'actor'
			entity: Actor
			node?: MindmapNode
	  }
	| {
			type: 'article'
			entity: WikiArticle
			node?: MindmapNode
	  }
	| {
			type: 'folder'
			entity: WikiFolder
			node?: MindmapNode
	  }
	| {
			type: 'tag'
			entity: WorldTag
			node?: MindmapNode
	  }

export function useEntityResolver() {
	const {
		id: worldId,
		events,
		actors,
		tags,
	} = useSelector(
		getWorldState,
		(a, b) => a.id === b.id && a.events === b.events && a.actors === b.actors && a.tags === b.tags,
	)
	const { data: mindmapData } = useGetMindmapQuery({ worldId }, { skip: !worldId })
	// const { markers } = useSelector(getTimelineState, (a, b) => a.markers === b.markers)
	// const { articles } = useSelector(getWikiState, (a, b) => a.articles === b.articles)

	const resolveEntity = (entityId: string): ResolvedMention | null => {
		const event = events.find((e) => e.id === entityId)
		if (event) {
			return { type: 'event', entity: event }
		}

		const markers = store.getState().timeline.markers
		const { articles, folders } = store.getState().wiki
		const marker = markers.find((m) => m.key === entityId)
		if (marker) {
			const event = events.find((e) => e.id === marker.eventId)
			if (event) {
				return { type: 'event', entity: event }
			}
		}

		const node = mindmapData?.nodes.find((n) => n.id === entityId)
		if (node) {
			const parentId =
				node.parentActorId ??
				node.parentArticleId ??
				node.parentEventId ??
				node.parentFolderId ??
				node.parentTagId

			if (parentId) {
				const resolvedEntity = resolveEntity(parentId)
				if (resolvedEntity) {
					return {
						...resolvedEntity,
						node,
					}
				}
			}
			return {
				type: 'node',
				entity: node,
				node,
			}
		}

		const actor = actors.find((a) => a.id === entityId)
		if (actor) {
			return { type: 'actor', entity: actor }
		}

		const article = articles.find((a) => a.id === entityId)
		if (article) {
			return { type: 'article', entity: article }
		}

		const folder = folders.find((f) => f.id === entityId)
		if (folder) {
			return { type: 'folder', entity: folder }
		}

		const tag = tags.find((t) => t.id === entityId)
		if (tag) {
			return { type: 'tag', entity: tag }
		}

		return null
	}

	const resolveNode = (nodeId: string) => {
		const node = mindmapData?.nodes.find((n) => n.id === nodeId)
		if (node) {
			const actor = actors.find((e) => e.id === node.parentActorId)
			if (actor) {
				return { type: 'actor', entity: actor }
			}
		}
		return null
	}

	return { resolveEntity, resolveNode }
}
