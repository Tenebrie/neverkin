import { useLayoutEffect } from 'react'
import { useSelector } from 'react-redux'

import { useGetMindmapQuery } from '@/api/mindmapApi'
import { useCurrentWorldId } from '@/app/views/world/hooks/useCurrentWorldId'
import {
	boxActor,
	boxArticle,
	boxEvent,
	boxFolder,
	boxPlainNode,
	boxTag,
} from '@/app/views/world/views/wiki/utils/boxEntity'
import { getWikiState } from '@/app/views/world/views/wiki/WikiSliceSelectors'
import { getWorldState } from '@/app/views/world/WorldSliceSelectors'

import { useMindmapContext } from '../../context/useMindmapContext'
import { MindmapNodeParcel, MindmapWireParcel } from '../../types'
import { getMindmapNodeParentId } from '../../utils/getMindmapNodeParentId'

export function MindmapContentManager() {
	const worldId = useCurrentWorldId()
	const {
		actors,
		events,
		tags,
		isLoaded: isWorldLoaded,
	} = useSelector(
		getWorldState,
		(a, b) =>
			a.actors === b.actors && a.events === b.events && a.tags === b.tags && a.isLoaded === b.isLoaded,
	)
	const { articles, folders, foldersLoaded, articlesLoaded } = useSelector(
		getWikiState,
		(a, b) =>
			a.articles === b.articles &&
			a.folders === b.folders &&
			a.foldersLoaded === b.foldersLoaded &&
			a.articlesLoaded === b.articlesLoaded,
	)
	const { data: mindmapData } = useGetMindmapQuery({ worldId })
	const { nodes, wires } = useMindmapContext()

	useLayoutEffect(() => {
		if (!mindmapData || !foldersLoaded || !articlesLoaded || !isWorldLoaded) {
			nodes.replace(new Map())
			wires.replace(new Map())
			return
		}

		const parents = {
			actor: createIndex(actors),
			article: createIndex(articles),
			event: createIndex(events),
			folder: createIndex(folders),
			tag: createIndex(tags),
		}

		const nextNodes = new Map<string, MindmapNodeParcel>()

		for (const node of mindmapData.nodes) {
			const parentId = getMindmapNodeParentId(node)

			const parent =
				(node.parentActorId && mapEntity(parents.actor.get(node.parentActorId), boxActor)) ??
				(node.parentArticleId && mapEntity(parents.article.get(node.parentArticleId), boxArticle)) ??
				(node.parentEventId && mapEntity(parents.event.get(node.parentEventId), boxEvent)) ??
				(node.parentFolderId && mapEntity(parents.folder.get(node.parentFolderId), boxFolder)) ??
				(node.parentTagId && mapEntity(parents.tag.get(node.parentTagId), boxTag)) ??
				(parentId ? null : boxPlainNode(node))

			if (!parent) {
				continue
			}

			const prev = nodes.get(node.id)
			const usedParent = prev?.parent.entity === parent.entity ? prev.parent : parent

			if (prev && prev.node === node && prev.parent.entity === parent.entity) {
				nextNodes.set(node.id, prev)
			} else {
				nextNodes.set(node.id, { id: node.id, node, parent: usedParent })
			}
		}

		const nextWires = new Map<string, MindmapWireParcel>()

		for (const wire of mindmapData.wires) {
			const sourceNode = nextNodes.get(wire.sourceNodeId)
			const targetNode = nextNodes.get(wire.targetNodeId)
			if (!sourceNode || !targetNode) {
				continue
			}

			const prev = wires.get(wire.id)
			if (prev && prev.wire === wire && prev.sourceNode === sourceNode && prev.targetNode === targetNode) {
				nextWires.set(wire.id, prev)
			} else {
				nextWires.set(wire.id, { wire, sourceNode, targetNode })
			}
		}

		nodes.replace(nextNodes)
		wires.replace(nextWires)
	}, [
		mindmapData,
		foldersLoaded,
		articlesLoaded,
		isWorldLoaded,
		actors,
		articles,
		events,
		folders,
		tags,
		nodes,
		wires,
	])

	return null
}

function createIndex<T extends { id: string }>(entities: T[]) {
	return new Map(entities.map((entity) => [entity.id, entity]))
}

function mapEntity<T, R>(entity: T | undefined, box: (entity: T) => R) {
	return entity && box(entity)
}
