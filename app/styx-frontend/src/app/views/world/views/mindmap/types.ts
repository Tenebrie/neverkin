import { MindmapNode, MindmapWire } from '@/api/types/mindmapTypes'

import { BoxedWikiEntity } from '../wiki/hooks/useBoxedWikiContent'

export type MindmapNodeParcel = {
	id: string
	node: MindmapNode
	parent: MindmapNodeParentParcel
}

export type MindmapNodeLayout = {
	x: number
	y: number
	width: number
	height: number
}

export type MindmapWireParcel = {
	wire: MindmapWire
	sourceNode: MindmapNodeParcel
	targetNode: MindmapNodeParcel
}

export type PlainMindmapNodeParcel = {
	type: 'node'
	entity: MindmapNode
	id: string
	name: string
	position: number
	color: string
}

export type MindmapNodeParentParcel = BoxedWikiEntity | PlainMindmapNodeParcel
