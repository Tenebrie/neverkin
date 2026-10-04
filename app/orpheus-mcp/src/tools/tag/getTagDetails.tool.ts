import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ContextService } from '@src/services/ContextService.js'
import { RheaService } from '@src/services/RheaService.js'
import { findByName } from '@src/utils/findByName.js'
import { Logger } from '@src/utils/Logger.js'
import { getSessionId, ToolExtra } from '@src/utils/toolHelpers.js'
import { z } from 'zod'

const TOOL_NAME = 'get_tag_details'

const inputSchema = z.object({
	tagName: z.string().describe('The name of the tag to find'),
})

export function registerGetTagDetailsTool(server: McpServer) {
	server.registerTool(
		TOOL_NAME,
		{
			title: 'Get Tag Details',
			description:
				'Get details about a specific tag by name, including description and all entities that mention this tag',
			inputSchema,
			annotations: {
				readOnlyHint: true,
				idempotentHint: true,
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

				const tagDetails = await RheaService.getTagDetails({
					worldId,
					tagId: tag.id,
					userId,
				})

				const mentionedByText =
					tagDetails.mentionedBy.length > 0
						? tagDetails.mentionedBy.map((m) => `  - ${m.type}: ${m.name} (${m.id})`).join('\n')
						: '  None'

				Logger.toolSuccess(TOOL_NAME, `Found tag: ${tag.name}`)
				return {
					content: [
						{
							type: 'text' as const,
							text:
								`Tag: ${tagDetails.name}\n` +
								`ID: ${tag.id}\n` +
								`Description: ${tagDetails.description || 'No description'}\n` +
								`Mentioned by:\n${mentionedByText}`,
						},
					],
				}
			} catch (error) {
				Logger.toolError(TOOL_NAME, error)
				return {
					content: [
						{
							type: 'text' as const,
							text: `Error fetching tag: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
						},
					],
					isError: true,
				}
			}
		},
	)
}
