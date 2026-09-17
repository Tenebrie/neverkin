import { MindmapLinkDirection } from '@prisma/client'
import { SessionMiddleware } from '@src/middleware/SessionMiddleware.js'
import { UserAuthMiddleware } from '@src/middleware/UserAuthMiddleware.js'
import { AuthorizationService } from '@src/services/AuthorizationService.js'
import { MindmapService } from '@src/services/MindmapService.js'
import { RedisService } from '@src/services/RedisService.js'
import { ValidationService } from '@src/services/ValidationService.js'
import { Router, useApiEndpoint, usePathParams, useQueryParams, useRequestBody } from 'moonflower'
import z from 'zod'

import { mindmapGroupTag, mindmapNodeTag, mindmapWireTag } from './utils/tags.js'

const router = new Router().with(SessionMiddleware).with(UserAuthMiddleware)

router.get('/api/world/:worldId/mindmap', async (ctx) => {
	useApiEndpoint({
		name: 'getMindmap',
		description: 'Gets the mindmap for the target world',
		tags: [mindmapGroupTag, mindmapNodeTag, mindmapWireTag],
	})

	const { worldId } = usePathParams(ctx, {
		worldId: z.string(),
	})

	await AuthorizationService.checkUserReadAccessById(ctx.user, worldId)

	return {
		nodes: await MindmapService.getNodes(worldId),
		wires: await MindmapService.getLinks(worldId),
	}
})

router.post('/api/world/:worldId/mindmap/nodes', async (ctx) => {
	useApiEndpoint({
		name: 'createNode',
		description: 'Creates a new node',
		tags: [mindmapGroupTag, mindmapNodeTag],
	})

	const { worldId } = usePathParams(ctx, {
		worldId: z.string(),
	})

	await AuthorizationService.checkUserWriteAccessById(ctx.user, worldId)

	const params = useRequestBody(ctx, {
		id: z.uuid().optional(),
		positionX: z.number(),
		positionY: z.number(),
		name: z.string().optional(),
		parentActorId: z.string().optional(),
		parentArticleId: z.string().optional(),
		parentEventId: z.string().optional(),
		parentFolderId: z.string().optional(),
		parentTagId: z.string().optional(),
	})

	await ValidationService.checkIfNodeParentListIsValid({ worldId, params })

	const node = await MindmapService.createNode({ worldId, ...params })
	RedisService.notifyAboutMindmapNodesUpdate(ctx, { worldId, nodes: [node] })

	return node
})

router.patch('/api/world/:worldId/mindmap/nodes/:nodeId', async (ctx) => {
	useApiEndpoint({
		name: 'updateNode',
		description: 'Updates the target node',
		tags: [mindmapGroupTag, mindmapNodeTag],
	})

	const { worldId, nodeId } = usePathParams(ctx, {
		worldId: z.string(),
		nodeId: z.string(),
	})

	await AuthorizationService.checkUserWriteAccessById(ctx.user, worldId)

	const params = useRequestBody(ctx, {
		positionX: z.number().optional(),
		positionY: z.number().optional(),
		name: z.string().optional(),
		content: z.string().optional(),
		contentRich: z.string().optional(),
	})

	const node = await MindmapService.updateNode(
		{
			nodeId,
			worldId,
		},
		params,
	)
	RedisService.notifyAboutMindmapNodesUpdate(ctx, { worldId, nodes: [node] })

	return node
})

router.post('/api/world/:worldId/mindmap/nodes/:nodeId/reparent', async (ctx) => {
	useApiEndpoint({
		name: 'reparentNode',
		description: 'Updates the target node parent',
		tags: [mindmapGroupTag, mindmapNodeTag],
	})

	const { worldId, nodeId } = usePathParams(ctx, {
		worldId: z.string(),
		nodeId: z.string(),
	})

	await AuthorizationService.checkUserWriteAccessById(ctx.user, worldId)

	const params = useRequestBody(ctx, {
		positionX: z.number().optional(),
		positionY: z.number().optional(),
		parentActorId: z.uuid().optional(),
		parentArticleId: z.uuid().optional(),
		parentEventId: z.uuid().optional(),
		parentFolderId: z.uuid().optional(),
		parentTagId: z.uuid().optional(),
	})

	await ValidationService.checkIfNodeParentListIsValid({ worldId, params })

	const { node, removedMentions } = await MindmapService.reparentNode(
		{
			nodeId,
			worldId,
		},
		{
			positionX: params.positionX,
			positionY: params.positionY,
			parentActorId: params.parentActorId ?? null,
			parentArticleId: params.parentArticleId ?? null,
			parentEventId: params.parentEventId ?? null,
			parentFolderId: params.parentFolderId ?? null,
			parentTagId: params.parentTagId ?? null,
		},
	)
	RedisService.notifyAboutMindmapNodesUpdate(ctx, { worldId, nodes: [node] })
	RedisService.notifyAboutUpdatedMentions(ctx, { worldId, mentions: removedMentions })

	return node
})

router.post('/api/world/:worldId/mindmap/nodes/move', async (ctx) => {
	useApiEndpoint({
		name: 'moveMindmapNodes',
		description: 'Moves multiple nodes by a delta in a single transaction',
		tags: [mindmapGroupTag, mindmapNodeTag],
	})

	const { worldId } = usePathParams(ctx, {
		worldId: z.string(),
	})

	await AuthorizationService.checkUserWriteAccessById(ctx.user, worldId)

	const params = useRequestBody(ctx, {
		nodeIds: z.array(z.string()),
		deltaX: z.number(),
		deltaY: z.number(),
	})

	const nodes = await MindmapService.moveNodes(params.nodeIds, params.deltaX, params.deltaY, worldId)
	RedisService.notifyAboutMindmapNodesUpdate(ctx, { worldId, nodes })

	return nodes
})

router.delete('/api/world/:worldId/mindmap/nodes', async (ctx) => {
	useApiEndpoint({
		name: 'deleteNodes',
		description: 'Deletes the target nodes',
		tags: [mindmapGroupTag, mindmapNodeTag],
	})

	const { worldId } = usePathParams(ctx, {
		worldId: z.string(),
	})

	const { nodes } = useQueryParams(ctx, {
		nodes: z.string().array(),
	})

	await AuthorizationService.checkUserWriteAccessById(ctx.user, worldId)

	const node = await MindmapService.deleteNodes(worldId, nodes)

	RedisService.notifyAboutMindmapNodesDelete(ctx, { worldId, nodes })

	return node
})

router.post('/api/world/:worldId/mindmap/wires', async (ctx) => {
	useApiEndpoint({
		name: 'createMindmapWires',
		description:
			'Creates new mindmap wires between nodes, or updates existing ones if the direction is changed',
		tags: [mindmapGroupTag, mindmapWireTag],
	})

	const { worldId } = usePathParams(ctx, {
		worldId: z.string(),
	})

	await AuthorizationService.checkUserWriteAccessById(ctx.user, worldId)

	const { wires } = useRequestBody(ctx, {
		wires: z.array(
			z.object({
				sourceNodeId: z.string(),
				targetNodeId: z.string(),
			}),
		),
	})

	const validWires = wires.filter((wire) => wire.sourceNodeId !== wire.targetNodeId)

	const { created, updated } = await MindmapService.createLinks(validWires)
	RedisService.notifyAboutMindmapWiresCreate(ctx, { worldId, created, updated })

	return {
		created,
		updated,
	}
})

router.patch('/api/world/:worldId/mindmap/wires/:wireId', async (ctx) => {
	useApiEndpoint({
		name: 'updateMindmapWire',
		description: 'Updates the target mindmap wire',
		tags: [mindmapGroupTag, mindmapWireTag],
	})

	const { worldId, wireId } = usePathParams(ctx, {
		worldId: z.string(),
		wireId: z.string(),
	})

	await AuthorizationService.checkUserWriteAccessById(ctx.user, worldId)

	const params = useRequestBody(ctx, {
		direction: z.enum(MindmapLinkDirection).optional(),
		content: z.string().optional(),
	})

	const wire = await MindmapService.updateLink(wireId, params)
	RedisService.notifyAboutMindmapWireUpdate(ctx, { worldId, wire })

	return wire
})

router.post('/api/world/:worldId/mindmap/wires/:wireId/split', async (ctx) => {
	useApiEndpoint({
		name: 'splitMindmapWire',
		description: 'Inserts a plain node linked two endpoints of the wire',
		tags: [mindmapGroupTag, mindmapNodeTag, mindmapWireTag],
	})

	const { worldId, wireId } = usePathParams(ctx, {
		worldId: z.string(),
		wireId: z.string(),
	})

	await AuthorizationService.checkUserWriteAccessById(ctx.user, worldId)

	const params = useRequestBody(ctx, {
		positionX: z.number(),
		positionY: z.number(),
		name: z.string(),
		direction: z.enum(MindmapLinkDirection),
	})

	const { node, created } = await MindmapService.splitLink({ worldId, linkId: wireId }, params)

	RedisService.notifyAboutMindmapNodesUpdate(ctx, { worldId, nodes: [node] })
	RedisService.notifyAboutMindmapWiresCreate(ctx, { worldId, created, updated: [] })
	RedisService.notifyAboutMindmapWiresDelete(ctx, { worldId, wires: [wireId] })

	return { node, wires: created }
})

router.delete('/api/world/:worldId/mindmap/wires', async (ctx) => {
	useApiEndpoint({
		name: 'deleteMindmapWires',
		description: 'Deletes specified mindmap wires',
		tags: [mindmapGroupTag, mindmapWireTag],
	})

	const { worldId } = usePathParams(ctx, {
		worldId: z.string(),
	})

	const { wires } = useQueryParams(ctx, {
		wires: z.string().array(),
	})

	await AuthorizationService.checkUserWriteAccessById(ctx.user, worldId)

	await MindmapService.deleteLinks(worldId, wires)
	RedisService.notifyAboutMindmapWiresDelete(ctx, { worldId, wires })

	return wires
})

export const MindmapRouter = router
