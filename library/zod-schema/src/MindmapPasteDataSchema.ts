import { z } from 'zod'

import { EntityNameSchema } from './EntityNameSchema.js'

const wireDirections = ['Normal', 'Reversed', 'TwoWay'] as const
const parentType = ['actor', 'article', 'event', 'folder', 'node', 'tag'] as const

export const MindmapPasteDataSchema = z.object({
	nodes: z.array(
		z.object({
			tempId: z.string(),
			offsetX: z.number(),
			offsetY: z.number(),
			parentId: z.string().nullable(),
			parentType: z.enum(parentType),
			plainNodeName: z.string(),
		}),
	),
	internalLinks: z.array(
		z.object({
			sourceTempId: z.string(),
			targetTempId: z.string(),
			direction: z.enum(wireDirections),
			content: EntityNameSchema,
		}),
	),
	externalLinks: z.array(
		z.object({
			sourceTempId: z.string(),
			targetNodeId: z.string(),
			direction: z.enum(wireDirections),
			content: EntityNameSchema,
		}),
	),
})

export type MindmapPasteData = z.infer<typeof MindmapPasteDataSchema>
