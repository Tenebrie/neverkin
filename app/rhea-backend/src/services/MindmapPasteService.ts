import { randomUUID } from 'node:crypto'

import { MindmapPasteData } from '@neverkin/zod-schema'

import {
	MindmapLinkUncheckedCreateInput,
	MindmapNodeUncheckedCreateInput,
} from '../../prisma/client/models.js'
import { AuthorizationService } from './AuthorizationService.js'
import { getPrismaClient } from './dbClients/DatabaseClient.js'
import { EntityResolverService } from './EntityResolverService.js'
import { MindmapService } from './MindmapService.js'

export const MindmapPasteService = {
	async pasteNodes(
		worldId: string,
		data: {
			originX: number
			originY: number
			pasteData: MindmapPasteData
		},
	) {
		const { originX, originY, pasteData } = data
		const {
			nodes: unvalidatedNodes,
			internalLinks: unvalidatedInternalLinks,
			externalLinks: unvalidatedExternalLinks,
		} = pasteData

		return getPrismaClient().$transaction(async (prisma) => {
			const parentValidationResult = await AuthorizationService.checkEntitiesWorldOwnership(
				worldId,
				unvalidatedNodes
					.filter((node) => node.parentId)
					.map((node) => ({
						id: node.parentId!,
						type: node.parentType,
					})),
				prisma,
			)

			const nodes = unvalidatedNodes.filter(
				(node) => !node.parentId || parentValidationResult.get(node.parentId),
			)
			if (nodes.length === 0) {
				return {
					nodes: [],
					wires: [],
				}
			}

			const remappedToNewNodes = new Map<string, string>()
			for (const node of nodes) {
				remappedToNewNodes.set(node.tempId, randomUUID())
			}

			// Nodes
			const createdNodes = await prisma.mindmapNode.createManyAndReturn({
				data: nodes.map(
					(node) =>
						({
							id: remappedToNewNodes.get(node.tempId)!,
							worldId,
							positionX: originX + node.offsetX,
							positionY: originY + node.offsetY,
							name: node.parentId === null ? node.plainNodeName : undefined,
							color: node.parentId === null ? node.plainNodeColor : undefined,
							...EntityResolverService.resolveNodeParentId(node.parentType, node.parentId),
						}) satisfies MindmapNodeUncheckedCreateInput,
				),
			})

			// Internal links
			const internalLinks = unvalidatedInternalLinks.filter(
				(link) => remappedToNewNodes.has(link.sourceTempId) && remappedToNewNodes.has(link.targetTempId),
			)

			const internalLinkIds = internalLinks.map(() => randomUUID())
			await prisma.mindmapLink.createMany({
				data: internalLinks.map(
					(wire, index) =>
						({
							id: internalLinkIds[index],
							sourceNodeId: remappedToNewNodes.get(wire.sourceTempId)!,
							targetNodeId: remappedToNewNodes.get(wire.targetTempId)!,
							direction: wire.direction,
							content: wire.content,
						}) satisfies MindmapLinkUncheckedCreateInput,
				),
			})
			await prisma.mindmapLinkWaypoint.createMany({
				data: internalLinks.flatMap((wire, linkIndex) =>
					wire.waypoints.map((waypoint, index) => ({
						linkId: internalLinkIds[linkIndex],
						index: index * 2,
						positionX: originX + waypoint.offsetX,
						positionY: originY + waypoint.offsetY,
					})),
				),
			})

			// External links
			const validTargets = await prisma.mindmapNode.findMany({
				where: {
					id: {
						in: unvalidatedExternalLinks.map((link) => link.targetNodeId),
					},
					worldId,
				},
				select: { id: true },
			})
			const validTargetIds = new Set(validTargets.map((target) => target.id))

			const externalLinks = unvalidatedExternalLinks.filter(
				(link) => remappedToNewNodes.has(link.sourceTempId) && validTargetIds.has(link.targetNodeId),
			)

			const externalLinkIds = externalLinks.map(() => randomUUID())
			await prisma.mindmapLink.createMany({
				data: externalLinks.map(
					(wire, index) =>
						({
							id: externalLinkIds[index],
							sourceNodeId: remappedToNewNodes.get(wire.sourceTempId)!,
							targetNodeId: wire.targetNodeId,
							direction: wire.direction,
							content: wire.content,
						}) satisfies MindmapLinkUncheckedCreateInput,
				),
			})

			return {
				nodes: createdNodes,
				wires: await MindmapService.getLinksByIds([...internalLinkIds, ...externalLinkIds], prisma),
			}
		})
	},
}
