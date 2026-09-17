import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ContextService } from '@src/services/ContextService.js'
import { RheaService } from '@src/services/RheaService.js'
import { findByName } from '@src/utils/findByName.js'
import { Logger } from '@src/utils/Logger.js'
import { CONTENT_ENTITY_TYPES, resolveEntityByName } from '@src/utils/resolveEntityByName.js'
import { getSessionId, ToolExtra } from '@src/utils/toolHelpers.js'
import z from 'zod'

const TOOL_NAME = 'delete_entity_content_page'

const inputSchema = z.object({
	entityName: z.string().describe('The name of the actor, event or article that owns the content page'),
	entityType: z
		.enum(CONTENT_ENTITY_TYPES)
		.optional()
		.describe('Only needed when the name is ambiguous across entity types.'),
	pageName: z.string().describe('The name of the content page to delete'),
})

export function registerDeleteEntityContentPageTool(server: McpServer) {
	server.registerTool(
		TOOL_NAME,
		{
			title: 'Delete Entity Content Page',
			description:
				'Delete a content page from an actor, event or article. This permanently removes the page and its content.',
			inputSchema,
			annotations: {
				destructiveHint: true,
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
				const { type, entity } = resolveEntityByName({
					name: entityName,
					types: entityType ? [entityType] : CONTENT_ENTITY_TYPES,
					worldData,
					articleData,
				})
				const page = findByName({ name: pageName, entities: entity.pages })

				await RheaService.deleteEntityContentPage({
					entityType: type,
					worldId,
					entityId: entity.id,
					userId,
					pageId: page.id,
				})

				Logger.toolSuccess(TOOL_NAME, `Deleted content page "${page.name}" from ${type} "${entity.name}"`)
				return {
					content: [
						{
							type: 'text' as const,
							text: `Content page "${page.name}" has been deleted from ${type} "${entity.name}".`,
						},
					],
				}
			} catch (error) {
				Logger.toolError(TOOL_NAME, error)
				return {
					content: [
						{
							type: 'text' as const,
							text: `Error deleting content page: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
						},
					],
					isError: true,
				}
			}
		},
	)
}
