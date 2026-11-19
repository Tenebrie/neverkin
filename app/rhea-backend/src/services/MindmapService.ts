import { MindmapLinkDirection, Prisma } from '@prisma/client'
import { BadRequestError } from 'moonflower'

import { AssetRefService } from './AssetRefService.js'
import { getPrismaClient } from './dbClients/DatabaseClient.js'
import { makeSortMindmapWaypointsQuery } from './dbQueries/makeSortMindmapWaypointsQuery.js'
import { makeTouchWorldQuery } from './dbQueries/makeTouchWorldQuery.js'
import { MentionsService } from './MentionsService.js'
import { CommonOrderBy } from './utils/commonOrderBy.js'

export const MindmapService = {
	async getNodes(worldId: string) {
		return getPrismaClient().mindmapNode.findMany({
			where: {
				worldId,
			},
			orderBy: CommonOrderBy,
		})
	},

	async createNode(data: Prisma.MindmapNodeUncheckedCreateInput) {
		return getPrismaClient().mindmapNode.create({
			data,
		})
	},
	async updateNode(
		{ nodeId, worldId }: { nodeId: string; worldId: string },
		params: Prisma.MindmapNodeUncheckedUpdateInput,
	) {
		return getPrismaClient().mindmapNode.update({
			where: { id: nodeId, worldId },
			data: params,
		})
	},
	async reparentNode(
		{ nodeId, worldId }: { nodeId: string; worldId: string },
		params: Prisma.MindmapNodeUncheckedUpdateInput,
	) {
		return getPrismaClient().$transaction(async (prisma) => {
			const removedMentions = await prisma.mention.findMany({
				where: { sourceNodeId: nodeId },
			})

			const node = await prisma.mindmapNode.update({
				where: { id: nodeId, worldId },
				data: {
					...params,
					name: '',
					content: '',
					contentRich: '',
					mentions: { set: [] },
					assetRefs: { set: [] },
				},
			})

			await prisma.contentPage.deleteMany({
				where: {
					parentNodeId: nodeId,
				},
			})
			await MentionsService.clearOrphanedMentions(prisma)
			await AssetRefService.clearOrphanedReferences(prisma)
			await makeTouchWorldQuery(worldId, prisma)

			return {
				node,
				removedMentions,
			}
		})
	},
	async moveElements({
		nodeIds,
		waypointIds,
		deltaX,
		deltaY,
		worldId,
	}: {
		nodeIds: string[]
		waypointIds: string[]
		deltaX: number
		deltaY: number
		worldId: string
	}) {
		return getPrismaClient().$transaction(async (prisma) => {
			const shift = {
				positionX: { increment: deltaX },
				positionY: { increment: deltaY },
			}
			const nodes = await prisma.mindmapNode.updateManyAndReturn({
				where: { id: { in: nodeIds }, worldId },
				data: shift,
			})
			await prisma.mindmapLinkWaypoint.updateMany({
				where: { id: { in: waypointIds } },
				data: shift,
			})
			const wires = await MindmapService.getLinksByIds(await findWaypointLinkIds(waypointIds, prisma), prisma)
			return { nodes, wires }
		})
	},
	async deleteNodes(worldId: string, nodeIds: string[]) {
		return getPrismaClient().mindmapNode.deleteMany({
			where: {
				id: { in: nodeIds },
				worldId,
			},
		})
	},

	async getLinks(worldId: string) {
		return getPrismaClient().mindmapLink.findMany({
			where: {
				sourceNode: { worldId },
			},
			include: { waypoints: { orderBy: { index: 'asc' } } },
			orderBy: CommonOrderBy,
		})
	},
	async getLink(wireId: string, prisma?: Prisma.TransactionClient) {
		return getPrismaClient(prisma).mindmapLink.findUniqueOrThrow({
			where: { id: wireId },
			include: { waypoints: { orderBy: { index: 'asc' } } },
		})
	},
	async createLinks(worldId: string, data: Prisma.MindmapLinkUncheckedCreateInput[]) {
		return getPrismaClient().$transaction(async (prisma) => {
			const allNodeIds = data.flatMap((d) => [d.sourceNodeId, d.targetNodeId])
			const owned = await prisma.mindmapNode.count({
				where: {
					id: { in: allNodeIds },
					worldId,
				},
			})

			if (owned < new Set(allNodeIds).size) {
				throw new BadRequestError('Not all nodes are owned by the world')
			}

			const existing = await prisma.mindmapLink.findMany({
				where: {
					OR: data.flatMap(({ sourceNodeId, targetNodeId }) => [
						{ sourceNodeId, targetNodeId },
						{ sourceNodeId: targetNodeId, targetNodeId: sourceNodeId }, // Reversed direction
					]),
				},
				select: { id: true, sourceNodeId: true, targetNodeId: true },
			})

			const existingMap = new Map(
				existing.flatMap((e) => [
					[`${e.sourceNodeId}-${e.targetNodeId}`, e],
					[`${e.targetNodeId}-${e.sourceNodeId}`, e],
				]),
			)

			const toCreate: Prisma.MindmapLinkUncheckedCreateInput[] = []
			const directionUpdates: ReturnType<typeof prisma.mindmapLink.update>[] = []

			for (const d of data) {
				const key = `${d.sourceNodeId}-${d.targetNodeId}`
				const match = existingMap.get(key)
				if (!match) {
					toCreate.push(d)
				} else {
					const direction = match.sourceNodeId === d.sourceNodeId ? 'Normal' : 'Reversed'
					directionUpdates.push(
						prisma.mindmapLink.update({
							where: { id: match.id },
							data: { direction },
						}),
					)
				}
			}

			const updated = await Promise.all(directionUpdates)

			if (toCreate.length === 0) {
				return { created: [], updated }
			}

			const created = await prisma.mindmapLink.createManyAndReturn({
				data: toCreate,
			})

			return { created, updated }
		})
	},
	async updateLink(
		{ wireId, worldId }: { wireId: string; worldId: string },
		params: Prisma.MindmapLinkUpdateInput,
	) {
		return getPrismaClient().mindmapLink.update({
			where: { id: wireId, sourceNode: { worldId } },
			data: params,
		})
	},
	async splitLink(
		{ worldId, wireId }: { worldId: string; wireId: string },
		{
			name,
			direction,
			...position
		}: { name: string; direction: MindmapLinkDirection; positionX: number; positionY: number },
	) {
		return getPrismaClient().$transaction(async (prisma) => {
			const link = await MindmapService.getLink(wireId, prisma)

			const node = await prisma.mindmapNode.create({
				data: { worldId, name, ...position },
			})

			const created = await prisma.mindmapLink.createManyAndReturn({
				data: [
					{ sourceNodeId: link.sourceNodeId, targetNodeId: node.id, direction },
					{ sourceNodeId: node.id, targetNodeId: link.targetNodeId, direction },
				],
			})

			await prisma.mindmapLink.delete({ where: { id: link.id } })

			return { node, created }
		})
	},
	async deleteLinks(worldId: string, wireIds: string[]) {
		return getPrismaClient().mindmapLink.deleteMany({
			where: {
				id: { in: wireIds },
				sourceNode: { worldId },
			},
		})
	},

	async getLinksByIds(wireIds: string[], prisma?: Prisma.TransactionClient) {
		return getPrismaClient(prisma).mindmapLink.findMany({
			where: { id: { in: wireIds } },
			include: { waypoints: { orderBy: { index: 'asc' } } },
			orderBy: CommonOrderBy,
		})
	},

	async createWaypoints(
		targets: { id: string; wireId: string; index: number }[],
		position: { positionX: number; positionY: number },
	) {
		return getPrismaClient().$transaction(async (prisma) => {
			await prisma.mindmapLinkWaypoint.createMany({
				data: targets.map((target) => ({
					id: target.id,
					linkId: target.wireId,
					index: target.index * 2 - 1,
					...position,
				})),
			})

			const wireIds = [...new Set(targets.map((target) => target.wireId))]
			for (const wireId of wireIds) {
				await makeSortMindmapWaypointsQuery(wireId, prisma)
			}
			return MindmapService.getLinksByIds(wireIds, prisma)
		})
	},
	async deleteWaypoints(waypointIds: string[]) {
		return getPrismaClient().$transaction(async (prisma) => {
			const wireIds = await findWaypointLinkIds(waypointIds, prisma)
			await prisma.mindmapLinkWaypoint.deleteMany({
				where: { id: { in: waypointIds } },
			})
			for (const wireId of wireIds) {
				await makeSortMindmapWaypointsQuery(wireId, prisma)
			}
			return MindmapService.getLinksByIds(wireIds, prisma)
		})
	},
}

async function findWaypointLinkIds(waypointIds: string[], prisma: Prisma.TransactionClient) {
	const waypoints = await prisma.mindmapLinkWaypoint.findMany({
		where: { id: { in: waypointIds } },
		select: { linkId: true },
		distinct: ['linkId'],
	})
	return waypoints.map((waypoint) => waypoint.linkId)
}
