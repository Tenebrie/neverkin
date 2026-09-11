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
	} = useSelector(
		getWorldState,
		(a, b) => a.id === b.id && a.actors === b.actors && a.events === b.events && a.tags === b.tags,
	)
	const { articles, folders } = useSelector(
		getWikiState,
		(a, b) => a.articles === b.articles && a.folders === b.folders,
	)
	const { data } = useGetMindmapQuery({ worldId }, { skip: !worldId })

	const nodeCache = useRef(new Map<object, BoxedMindmapNode>())
	const wireCache = useRef(new Map<object, BoxedMindmapWire>())

	return useMemo(() => {
		if (!data) {
			return {
				isLoaded: false,
				actorsWithNodes: [] as BoxedMindmapNode[],
				nodeLinks: [] as BoxedMindmapWire[],
				existingWires: new Set<string>(),
			}
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

		const actorsWithNodes: BoxedMindmapNode[] = []
		const nodeById = new Map<string, BoxedMindmapNode>()

		for (const node of data.nodes) {
			const parentId = getMindmapNodeParentId(node)

			const parent =
				(node.parentActorId &&
					(() => {
						const a = actors.find((a) => a.id === node.parentActorId)
						return a && boxActor(a)
					})()) ??
				(node.parentArticleId &&
					(() => {
						const a = articles.find((a) => a.id === node.parentArticleId)
						return a && boxArticle(a)
					})()) ??
				(node.parentEventId &&
					(() => {
						const e = events.find((e) => e.id === node.parentEventId)
						return e && boxEvent(e)
					})()) ??
				(node.parentFolderId &&
					(() => {
						const f = folders.find((f) => f.id === node.parentFolderId)
						return f && boxFolder(f)
					})()) ??
				(node.parentTagId &&
					(() => {
						const t = tags.find((t) => t.id === node.parentTagId)
						return t && boxTag(t)
					})()) ??
				(parentId ? null : boxPlainNode(node))

			if (!parent) continue

			const boxed = stableNode(node, parent, () => ({ id: node.id, node, parent }))
			actorsWithNodes.push(boxed)
			nodeById.set(node.id, boxed)
		}

		nodeCache.current = nextNodeCache

		const prevWireCache = wireCache.current
		const nextWireCache = new Map<object, BoxedMindmapWire>()

		const nodeLinks: BoxedMindmapWire[] = []
		const existingWires = new Set<string>()

		for (const wire of data.wires) {
			const sourceNode = nodeById.get(wire.sourceNodeId)
			const targetNode = nodeById.get(wire.targetNodeId)
			if (!sourceNode || !targetNode) continue

			const cached = prevWireCache.get(wire)
			if (cached && cached.sourceNode === sourceNode && cached.targetNode === targetNode) {
				nextWireCache.set(wire, cached)
				nodeLinks.push(cached)
			} else {
				const boxed: BoxedMindmapWire = { ...wire, sourceNode, targetNode }
				nextWireCache.set(wire, boxed)
				nodeLinks.push(boxed)
			}

			existingWires.add(`${sourceNode.id}->${targetNode.id}`)
		}

		wireCache.current = nextWireCache

		return { isLoaded: true, actorsWithNodes, nodeLinks, existingWires }
	}, [data, actors, articles, events, folders, tags])
}
