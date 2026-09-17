import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ContextService } from '@src/services/ContextService.js'
import { RheaService } from '@src/services/RheaService.js'
import { findByName } from '@src/utils/findByName.js'
import { Logger } from '@src/utils/Logger.js'
import { normalizeColor } from '@src/utils/normalizeColor.js'
import { getSessionId, ToolExtra } from '@src/utils/toolHelpers.js'
import z from 'zod'

const TOOL_NAME = 'update_article'

const inputSchema = z.object({
	articleName: z.string().describe('The name of the article to update'),
	name: z.string().optional().describe('The new name for the article (optional)'),
	color: z
		.string()
		.optional()
		.describe('The new color for the article in RGB hex format, e.g. #bf8a40 (optional)'),
})

export function registerUpdateArticleTool(server: McpServer) {
	server.registerTool(
		TOOL_NAME,
		{
			title: 'Update Article',
			description: [
				'Update an existing wiki article by name. Find the article by name and update its properties.',
				'To update content, use update_entity_content.',
			].join('\n'),
			inputSchema,
			annotations: {
				idempotentHint: true,
			},
		},
		async (args: z.infer<typeof inputSchema>, extra: ToolExtra) => {
			try {
				const sessionId = getSessionId(extra)
				Logger.toolInvocation(TOOL_NAME, args)

				const worldId = await ContextService.getCurrentWorldOrThrow(sessionId)
				const userId = await ContextService.getCurrentUserIdOrThrow(sessionId)
				const { articleName, name, color } = args

				const articleData = await RheaService.getWorldArticles({ worldId, userId })
				const article = findByName({ name: articleName, entities: articleData })

				let updatedName = article.name
				if (name !== undefined || color !== undefined) {
					const updatedArticle = await RheaService.updateArticle({
						worldId,
						articleId: article.id,
						userId,
						name,
						color: normalizeColor(color),
					})
					updatedName = updatedArticle.name
				}

				Logger.toolSuccess(TOOL_NAME, `Updated article "${updatedName}"`)
				return {
					content: [
						{
							type: 'text' as const,
							text:
								`Article updated successfully!\n` +
								`Name: ${updatedName}\n` +
								`ID: ${article.id}\n` +
								`Color: ${article.color || '(None)'}`,
						},
					],
				}
			} catch (error) {
				Logger.toolError(TOOL_NAME, error)
				return {
					content: [
						{
							type: 'text' as const,
							text: `Error updating article: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
						},
					],
					isError: true,
				}
			}
		},
	)
}
