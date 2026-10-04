import { randomUUID } from 'node:crypto'

import { MindmapPasteData } from '@neverkin/zod-schema'

import {
	MindmapLinkUncheckedCreateInput,
	MindmapNodeUncheckedCreateInput,
} from '../../prisma/client/models.js'
import { AuthorizationService } from './AuthorizationService.js'
import { getPrismaClient } from './dbClients/DatabaseClient.js'
import { EntityResolverService } from './EntityResolverService.js'

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
							...EntityResolverService.resolveNodeParentId(node.parentType, node.parentId),
						}) satisfies MindmapNodeUncheckedCreateInput,
				),
			})

			// Internal links
			const internalLinks = unvalidatedInternalLinks.filter(
				(link) => remappedToNewNodes.has(link.sourceTempId) && remappedToNewNodes.has(link.targetTempId),
			)

			const createdInternalLinks = await prisma.mindmapLink.createManyAndReturn({
				data: internalLinks.map(
					(wire) =>
						({
							sourceNodeId: remappedToNewNodes.get(wire.sourceTempId)!,
							targetNodeId: remappedToNewNodes.get(wire.targetTempId)!,
							direction: wire.direction,
							content: wire.content,
						}) satisfies MindmapLinkUncheckedCreateInput,
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

			const createdExternalLinks = await prisma.mindmapLink.createManyAndReturn({
				data: externalLinks.map(
					(wire) =>
						({
							sourceNodeId: remappedToNewNodes.get(wire.sourceTempId)!,
							targetNodeId: wire.targetNodeId,
							direction: wire.direction,
							content: wire.content,
						}) satisfies MindmapLinkUncheckedCreateInput,
				),
			})

			return {
				nodes: createdNodes,
				wires: createdInternalLinks.concat(createdExternalLinks),
			}
		})
	},
}
