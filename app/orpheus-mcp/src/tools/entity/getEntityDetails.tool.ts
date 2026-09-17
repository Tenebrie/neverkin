import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ContextService } from '@src/services/ContextService.js'
import { RheaService } from '@src/services/RheaService.js'
import { findByName } from '@src/utils/findByName.js'
import { formatTimestamp } from '@src/utils/formatTimestamp.js'
import { Logger } from '@src/utils/Logger.js'
import { CONTENT_ENTITY_TYPES, ResolvedEntity, resolveEntityByName } from '@src/utils/resolveEntityByName.js'
import { resolveSavedMentions } from '@src/utils/resolveSavedMentions.js'
import { toAgentReadableText } from '@src/utils/toAgentReadableText.js'
import { getSessionId, ToolExtra } from '@src/utils/toolHelpers.js'
import z from 'zod'

const TOOL_NAME = 'get_entity_details'

const inputSchema = z.object({
	entityName: z.string().describe('The name of the actor, event or article to find'),
	entityType: z
		.enum(CONTENT_ENTITY_TYPES)
		.optional()
		.describe('Only needed when the name is ambiguous across entity types.'),
	pageName: z
		.string()
		.optional()
		.describe('The content page to fetch, if not provided, the main content will be fetched'),
})

export function registerGetEntityDetailsTool(server: McpServer) {
	server.registerTool(
		TOOL_NAME,
		{
			title: 'Get Entity Details',
			description: [
				'Get details of an actor, event or article by name, including its content and mentions.',
				'Use pageName to read a specific content page. Without pageName, returns main content.',
			].join('\n'),
			inputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		async (args: z.infer<typeof inputSchema>, extra: ToolExtra) => {
			try {
				const sessionId = getSessionId(extra)
				Logger.toolInvocation(TOOL_NAME, args)

				const worldId = await ContextService.getCurrentWorldOrThrow(sessionId)
				const userId = await ContextService.getCurrentUserIdOrThrow(sessionId)
				const { entityName, entityType, pageName } = args

				const worldData = await RheaService.getWorldDetails({ worldId, userId })
				const articleData = await RheaService.getWorldArticles({ worldId, userId })
				const resolved = resolveEntityByName({
					name: entityName,
					types: entityType ? [entityType] : CONTENT_ENTITY_TYPES,
					worldData,
					articleData,
				})
				const { type, entity } = resolved
				const page = pageName ? findByName({ name: pageName, entities: entity.pages }) : undefined

				const rawContent = await RheaService.getEntityContent({
					entityType: type,
					worldId,
					entityId: entity.id,
					userId,
					pageId: page?.id,
				})
				const content = toAgentReadableText({ content: rawContent.contentHtml ?? '' })
				const mentionsOutput = resolveSavedMentions({ entity, worldData, articleData })

				Logger.toolSuccess(TOOL_NAME, `Found ${type}: ${entity.name}`)
				return {
					content: [
						{
							type: 'text' as const,
							text:
								formatHeader(resolved, worldData) +
								`Page: ${page?.name || '(Main content)'}\n\n` +
								`${content || '(No content provided)'}`,
						},
						{
							type: 'text' as const,
							text:
								'Pages: ' +
								entity.pages.map((page) => `"${page.name}"`).join(', ') +
								(entity.pages.length === 0 ? '(None)' : ''),
						},
						...mentionsOutput,
					],
				}
			} catch (error) {
				Logger.toolError(TOOL_NAME, error)
				return {
					content: [
						{
							type: 'text' as const,
							text: `Error fetching entity details: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
						},
					],
					isError: true,
				}
			}
		},
	)
}

function formatHeader(
	resolved: Extract<ResolvedEntity, { type: (typeof CONTENT_ENTITY_TYPES)[number] }>,
	worldData: Awaited<ReturnType<typeof RheaService.getWorldDetails>>,
) {
	const { type, entity } = resolved
	const lines = [`${capitalize(type)}: ${entity.name}`, `ID: ${entity.id}`]
	if (type === 'actor') {
		lines.push(`Title: ${entity.title || '(None)'}`)
	}
	if (type === 'event') {
		lines.push(`DateTime: ${formatTimestamp(entity.timestamp, worldData)}`)
	}
	lines.push(`Color: ${entity.color || '(None)'}`)
	return lines.join('\n') + '\n'
}

function capitalize(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1)
}
