import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ContextService } from '@src/services/ContextService.js'
import { RheaService } from '@src/services/RheaService.js'
import { findByName } from '@src/utils/findByName.js'
import { Logger } from '@src/utils/Logger.js'
import { getSessionId, ToolExtra } from '@src/utils/toolHelpers.js'
import { z } from 'zod'

const TOOL_NAME = 'delete_tag'

const inputSchema = z.object({
	tagName: z.string().describe('The name of the tag to delete'),
})

export function registerDeleteTagTool(server: McpServer) {
	server.registerTool(
		TOOL_NAME,
		{
			title: 'Delete Tag',
			description: 'Delete a tag by name from the current world',
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
				const { tagName } = args

				const worldData = await RheaService.getWorldDetails({ worldId, userId })
				const tag = findByName({ name: tagName, entities: worldData.tags })

				await RheaService.deleteTag({
					worldId,
					tagId: tag.id,
					userId,
				})

				Logger.toolSuccess(TOOL_NAME, `Deleted tag: ${tag.name}`)
				return {
					content: [
						{
							type: 'text' as const,
							text: `Tag "${tag.name}" has been deleted successfully.`,
						},
					],
				}
			} catch (error) {
				Logger.toolError(TOOL_NAME, error)
				return {
					content: [
						{
							type: 'text' as const,
							text: `Error deleting tag: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
						},
					],
					isError: true,
				}
			}
		},
	)
}
