import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ContextService } from '@src/services/ContextService.js'
import { RheaService } from '@src/services/RheaService.js'
import { findByName } from '@src/utils/findByName.js'
import { Logger } from '@src/utils/Logger.js'
import { getSessionId, ToolExtra } from '@src/utils/toolHelpers.js'
import { z } from 'zod'

const TOOL_NAME = 'update_tag'

const inputSchema = z.object({
	tagName: z.string().describe('The name of the tag to update'),
	name: z.string().optional().describe('The new name for the tag (optional)'),
	description: z.string().optional().describe('The new description for the tag (optional)'),
})

export function registerUpdateTagTool(server: McpServer) {
	server.registerTool(
		TOOL_NAME,
		{
			title: 'Update Tag',
			description: 'Update an existing tag by name. Find the tag by name and update its properties.',
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
				const { tagName, name, description } = args

				const worldData = await RheaService.getWorldDetails({ worldId, userId })
				const tag = findByName({ name: tagName, entities: worldData.tags })

				const updatedTag = await RheaService.updateTag({
					worldId,
					tagId: tag.id,
					userId,
					name,
					description,
				})

				Logger.toolSuccess(TOOL_NAME, `Updated tag: ${updatedTag.name}`)
				return {
					content: [
						{
							type: 'text' as const,
							text:
								`Tag updated successfully!\n` +
								`Name: ${updatedTag.name}\n` +
								`ID: ${updatedTag.id}\n` +
								`Description: ${updatedTag.description || 'None'}`,
						},
					],
				}
			} catch (error) {
				Logger.toolError(TOOL_NAME, error)
				return {
					content: [
						{
							type: 'text' as const,
							text: `Error updating tag: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
						},
					],
					isError: true,
				}
			}
		},
	)
}
