import { useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'

import { useGetMindmapQuery } from '@/api/mindmapApi'
import { MindmapNode, MindmapWire } from '@/api/types/mindmapTypes'
import { getWorldState } from '@/app/views/world/WorldSliceSelectors'

import { BoxedWikiEntity } from '../../wiki/hooks/useBoxedWikiContent'
import { boxActor, boxArticle, boxEvent, boxFolder, boxTag } from '../../wiki/utils/boxEntity'
import { getWikiState } from '../../wiki/WikiSliceSelectors'
import { getMindmapNodeParentId } from '../utils/getMindmapNodeParentId'

/**
 * A node with no backing entity. It lives only on the mindmap, so it is boxed as its own parent.
 */
export type BoxedPlainNode = {
	type: 'node'
	entity: MindmapNode
	id: string
	name: string
	position: number
	color: string
}

export type BoxedMindmapParent = BoxedWikiEntity | BoxedPlainNode

export function boxPlainNode(node: MindmapNode): BoxedPlainNode {
	return {
		type: 'node',
		entity: node,
		id: node.id,
		name: node.name,
		position: 0,
		color: PLAIN_NODE_COLOR,
	}
}

const PLAIN_NODE_COLOR = '#6b7a99'

export type BoxedMindmapNode = {
	id: string
	node: MindmapNode
	parent: BoxedMindmapParent
}

export type BoxedMindmapWire = MindmapWire & {
	sourceNode: BoxedMindmapNode
	targetNode: BoxedMindmapNode
}

export function useBoxedMindmapContent() {
	const {
		id: worldId,
		actors,
		events,
		tags,
		isLoaded: isWorldLoaded,
	} = useSelector(
		getWorldState,
		(a, b) =>
			a.id === b.id &&
			a.actors === b.actors &&
			a.events === b.events &&
			a.tags === b.tags &&
			a.isLoaded === b.isLoaded,
	)
	const { articles, folders, foldersLoaded, articlesLoaded } = useSelector(
		getWikiState,
		(a, b) => a.articles === b.articles && a.folders === b.folders,
	)
	const { data } = useGetMindmapQuery({ worldId }, { skip: !worldId })

	const nodeCache = useRef(new Map<object, BoxedMindmapNode>())
	const wireCache = useRef(new Map<object, BoxedMindmapWire>())
	const existingWiresCache = useRef(new Set<string>())

	return useMemo(() => {
		if (!data || !foldersLoaded || !articlesLoaded || !isWorldLoaded) {
			return {
				isLoaded: false,
				nodes: new Map<string, BoxedMindmapNode>(),
				wires: new Map<string, BoxedMindmapWire>(),
				existingWires: existingWiresCache.current,
			}
		}

		const parents = {
			actor: indexById(actors),
			article: indexById(articles),
			event: indexById(events),
			folder: indexById(folders),
			tag: indexById(tags),
		}

		const prevNodeCache = nodeCache.current
		const nextNodeCache = new Map<object, BoxedMindmapNode>()

		function stableNode(
			identity: MindmapNode,
			parent: BoxedMindmapParent,
			make: () => BoxedMindmapNode,
		): BoxedMindmapNode {
			const cached = prevNodeCache.get(identity)
			if (cached && cached.parent.entity === parent.entity) {
				nextNodeCache.set(identity, cached)
				return cached
			}
			const item = make()
			nextNodeCache.set(identity, item)
			return item
		}

		const nodes = new Map<string, BoxedMindmapNode>()

		for (const node of data.nodes) {
			const parentId = getMindmapNodeParentId(node)

			const parent =
				(node.parentActorId && mapEntity(parents.actor.get(node.parentActorId), boxActor)) ??
				(node.parentArticleId && mapEntity(parents.article.get(node.parentArticleId), boxArticle)) ??
				(node.parentEventId && mapEntity(parents.event.get(node.parentEventId), boxEvent)) ??
				(node.parentFolderId && mapEntity(parents.folder.get(node.parentFolderId), boxFolder)) ??
				(node.parentTagId && mapEntity(parents.tag.get(node.parentTagId), boxTag)) ??
				(parentId ? null : boxPlainNode(node))

			if (!parent) continue

			nodes.set(
				node.id,
				stableNode(node, parent, () => ({ id: node.id, node, parent })),
			)
		}

		nodeCache.current = nextNodeCache

		const prevWireCache = wireCache.current
		const nextWireCache = new Map<object, BoxedMindmapWire>()

		const wires = new Map<string, BoxedMindmapWire>()
		const existingWires = new Set<string>()

		for (const wire of data.wires) {
			const sourceNode = nodes.get(wire.sourceNodeId)
			const targetNode = nodes.get(wire.targetNodeId)
			if (!sourceNode || !targetNode) continue

			const cached = prevWireCache.get(wire)
			if (cached && cached.sourceNode === sourceNode && cached.targetNode === targetNode) {
				nextWireCache.set(wire, cached)
				wires.set(wire.id, cached)
			} else {
				const boxed: BoxedMindmapWire = { ...wire, sourceNode, targetNode }
				nextWireCache.set(wire, boxed)
				wires.set(wire.id, boxed)
			}

			existingWires.add(`${sourceNode.id}->${targetNode.id}`)
		}

		wireCache.current = nextWireCache
		if (!isSameSet(existingWiresCache.current, existingWires)) {
			existingWiresCache.current = existingWires
		}

		return { isLoaded: true, nodes, wires, existingWires: existingWiresCache.current }
	}, [data, foldersLoaded, articlesLoaded, isWorldLoaded, actors, articles, events, folders, tags])
}

function indexById<T extends { id: string }>(entities: T[]) {
	return new Map(entities.map((entity) => [entity.id, entity]))
}

function mapEntity<T, R>(entity: T | undefined, box: (entity: T) => R) {
	return entity && box(entity)
}

function isSameSet(a: Set<string>, b: Set<string>) {
	return a.size === b.size && [...b].every((value) => a.has(value))
}
