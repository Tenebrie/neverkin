import { MindmapNode } from '@/api/types/mindmapTypes'
import { Actor, WorldEvent, WorldTag } from '@/api/types/worldTypes'
import { WikiArticle, WikiFolder } from '@/api/types/worldWikiTypes'
import { DefaultColors } from '@/app/features/colors/defaultColors'

import { PlainMindmapNodeParcel } from '../../mindmap/types'
import { BoxedWikiEntity } from '../hooks/useBoxedWikiContent'

export function boxActor(actor: Actor): BoxedWikiEntity {
	return {
		id: actor.id,
		type: 'actor',
		entity: actor,
		name: actor.name,
		position: actor.parentFolderPosition,
		color: actor.color,
	}
}

export function boxArticle(article: WikiArticle): BoxedWikiEntity {
	return {
		id: article.id,
		type: 'article',
		entity: article,
		name: article.name,
		position: article.parentFolderPosition,
		color: article.color,
	}
}

export function boxEvent(event: WorldEvent): BoxedWikiEntity {
	return {
		id: event.id,
		type: 'event',
		entity: event,
		name: event.name,
		position: event.parentFolderPosition,
		color: event.color,
	}
}

export function boxFolder(folder: WikiFolder): BoxedWikiEntity {
	return {
		id: folder.id,
		type: 'folder',
		entity: folder,
		name: folder.name,
		position: folder.parentFolderPosition,
		color: folder.color,
	}
}

export function boxTag(tag: WorldTag): BoxedWikiEntity {
	return {
		id: tag.id,
		type: 'tag',
		entity: tag,
		name: tag.name,
		position: tag.parentFolderPosition,
		color: tag.color,
	}
}

export function boxPlainNode(node: MindmapNode): PlainMindmapNodeParcel {
	return {
		id: node.id,
		type: 'node',
		entity: node,
		name: node.name,
		position: 0,
		color: DefaultColors.node,
	}
}
