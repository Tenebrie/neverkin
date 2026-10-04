import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ContextService } from '@src/services/ContextService.js'
import { RheaService } from '@src/services/RheaService.js'
import { Logger } from '@src/utils/Logger.js'
import { getSessionId, ToolExtra } from '@src/utils/toolHelpers.js'
import { z } from 'zod'

const TOOL_NAME = 'create_world'

const inputSchema = z.object({
	name: z.string().describe('The name of the world'),
	description: z.string().optional().describe('The description of the world (optional)'),
})

export function registerCreateWorldTool(server: McpServer) {
	server.registerTool(
		TOOL_NAME,
		{
			title: 'Create World',
			description:
				'Create a new world for organizing your stories, characters, and events. All worlds are FULLY separated. Entities can only interact within their world.',
			inputSchema,
		},
		async (args: z.infer<typeof inputSchema>, extra: ToolExtra) => {
			try {
				const sessionId = getSessionId(extra)
				Logger.toolInvocation(TOOL_NAME, args)

				const userId = await ContextService.getCurrentUserIdOrThrow(sessionId)
				const { name, description } = args

				const world = await RheaService.createWorld({
					userId,
					name,
					description,
				})

				// Automatically set the new world as the current context
				await ContextService.setCurrentWorld(sessionId, world.id)

				Logger.toolSuccess(TOOL_NAME, `Created world: ${world.name} (${world.id})`)
				return {
					content: [
						{
							type: 'text' as const,
							text:
								`World created successfully!\n` +
								`Name: ${world.name}\n` +
								`ID: ${world.id}\n\n` +
								`The new world has been automatically set as your current context.`,
						},
					],
				}
			} catch (error) {
				Logger.toolError(TOOL_NAME, error)
				return {
					content: [
						{
							type: 'text' as const,
							text: `Error creating world: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
						},
					],
					isError: true,
				}
			}
		},
	)
}
