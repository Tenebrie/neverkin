import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ContextService } from '@src/services/ContextService.js'
import { RheaService } from '@src/services/RheaService.js'
import { nameMatchesExactly } from '@src/utils/findByName.js'
import { formatTimestamp } from '@src/utils/formatTimestamp.js'
import { Logger } from '@src/utils/Logger.js'
import { normalizeColor } from '@src/utils/normalizeColor.js'
import { resolveShorthandMentions } from '@src/utils/resolveShorthandMentions.js'
import { resolveTimestamp } from '@src/utils/resolveTimestamp.js'
import { getSessionId, ToolExtra } from '@src/utils/toolHelpers.js'
import z from 'zod'

const TOOL_NAME = 'create_entities'

const name = z.string().describe('Human readable, unique within its type')
const color = z.string().optional().describe('RGB hex format, e.g. #bf8a40 (optional)')
const content = z
	.string()
	.optional()
	.describe('HTML content (optional). May mention entities created in the same batch.')

const entitySchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('actor'), name, title: z.string().optional(), color, content }),
	z.object({
		type: z.literal('event'),
		name,
		timestamp: z.string().describe("In the world calendar's date format. Must match it precisely."),
		color,
		content,
	}),
	z.object({ type: z.literal('article'), name, color, content }),
	z.object({ type: z.literal('tag'), name, description: z.string().optional() }),
])

const BATCH_LIMIT = 20

const inputSchema = z.object({
	entities: z
		.array(entitySchema)
		.min(1)
		.max(BATCH_LIMIT)
		.describe(`Entities to create, in order. At most ${BATCH_LIMIT} per call.`),
})

type EntityInput = z.infer<typeof entitySchema>
type WorldData = Awaited<ReturnType<typeof RheaService.getWorldDetails>>

export function registerCreateEntitiesTool(server: McpServer) {
	server.registerTool(
		TOOL_NAME,
		{
			title: 'Create Entities',
			description: [
				'Create one or more actors, events, articles and tags in the current world in a single call.',
				'All entities are created before any content is written, so content may mention any entity in the batch.',
				'Nothing is written if a name already exists, a name repeats within the batch, or a timestamp fails to parse.',

				'To mention another entity in content, use the following syntax:',
				'@[Entity Name]',
				'It will be automatically resolved into an HTML tag.',

				'Content is HTML. Use <p>, <ul>, <li>, <b> etc.',
				'Mentions link entities together and show up in "Mentions" and "Mentioned in" fields.',
			].join('\n'),
			inputSchema,
		},
		async (args: z.infer<typeof inputSchema>, extra: ToolExtra) => {
			const result: string[] = []
			try {
				const sessionId = getSessionId(extra)
				Logger.toolInvocation(TOOL_NAME, args)

				const worldId = await ContextService.getCurrentWorldOrThrow(sessionId)
				const userId = await ContextService.getCurrentUserIdOrThrow(sessionId)
				const { entities } = args

				const worldData = await RheaService.getWorldDetails({ worldId, userId })
				const articleData = await RheaService.getWorldArticles({ worldId, userId })
				validateBatch({ entities, worldData, articleData })

				const createdIds: string[] = []
				for (const entity of entities) {
					const created = await createEntity({ entity, worldData, worldId, userId })
					createdIds.push(created.id)
					result.push(describeCreated(entity, worldData))
				}

				const hasContent = entities.some((entity) => entity.type !== 'tag' && entity.content)
				if (hasContent) {
					const refreshedWorld = await RheaService.getWorldDetails({ worldId, userId })
					const refreshedArticles = await RheaService.getWorldArticles({ worldId, userId })
					for (const [index, entity] of entities.entries()) {
						if (entity.type === 'tag' || !entity.content) {
							continue
						}
						const parsedContent = await resolveShorthandMentions({
							content: entity.content,
							worldData: refreshedWorld,
							articleData: refreshedArticles,
						})
						await RheaService.updateEntityContent({
							entityType: entity.type,
							worldId,
							entityId: createdIds[index],
							userId,
							content: parsedContent,
						})
						result.push(`Content set for ${entity.type} "${entity.name}".`)
					}
				}

				Logger.toolSuccess(TOOL_NAME, `Created ${entities.length} entities`)
				return {
					content: result.map((message) => ({ type: 'text' as const, text: message })),
				}
			} catch (error) {
				Logger.toolError(TOOL_NAME, error)
				return {
					content: [
						...result.map((message) => ({ type: 'text' as const, text: message })),
						{
							type: 'text' as const,
							text: `Error creating entities: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
						},
					],
					isError: true,
				}
			}
		},
	)
}

function validateBatch({
	entities,
	worldData,
	articleData,
}: {
	entities: EntityInput[]
	worldData: WorldData
	articleData: Awaited<ReturnType<typeof RheaService.getWorldArticles>>
}) {
	const existing = {
		actor: worldData.actors,
		event: worldData.events,
		article: articleData,
		tag: worldData.tags,
	}
	entities.forEach((entity, index) => {
		const sameName = (e: { name: string }) => nameMatchesExactly({ query: entity.name, entityName: e.name })
		if (existing[entity.type].some(sameName)) {
			throw new Error(`${entity.type} "${entity.name}" already exists.`)
		}
		if (entities.slice(0, index).some((e) => e.type === entity.type && sameName(e))) {
			throw new Error(`${entity.type} "${entity.name}" appears more than once in the batch.`)
		}
		if (entity.type === 'event') {
			resolveTimestamp(entity.timestamp, worldData)
		}
	})
}

async function createEntity({
	entity,
	worldData,
	worldId,
	userId,
}: {
	entity: EntityInput
	worldData: WorldData
	worldId: string
	userId: string
}) {
	switch (entity.type) {
		case 'actor':
			return RheaService.createActor({
				worldId,
				userId,
				name: entity.name,
				title: entity.title,
				color: normalizeColor(entity.color),
			})
		case 'event':
			return RheaService.createEvent({
				worldId,
				userId,
				name: entity.name,
				timestamp: resolveTimestamp(entity.timestamp, worldData),
				color: normalizeColor(entity.color),
				contentRich: '',
			})
		case 'article':
			return RheaService.createArticle({
				worldId,
				userId,
				name: entity.name,
				color: normalizeColor(entity.color),
				contentRich: '',
			})
		case 'tag':
			return RheaService.createTag({
				worldId,
				userId,
				name: entity.name,
				description: entity.description,
			})
	}
}

function describeCreated(entity: EntityInput, worldData: WorldData) {
	if (entity.type === 'actor' && entity.title) {
		return `Created actor: ${entity.name} (${entity.title})`
	}
	if (entity.type === 'event') {
		const timestamp = formatTimestamp(resolveTimestamp(entity.timestamp, worldData), worldData)
		return `Created event: ${entity.name} (${timestamp})`
	}
	return `Created ${entity.type}: ${entity.name}`
}
