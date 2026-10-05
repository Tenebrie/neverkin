import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ContextService } from '@src/services/ContextService.js'
import { RheaService } from '@src/services/RheaService.js'
import { findByName } from '@src/utils/findByName.js'
import { Logger } from '@src/utils/Logger.js'
import { getSessionId, ToolExtra } from '@src/utils/toolHelpers.js'
import { z } from 'zod'

const TOOL_NAME = 'delete_actor'

const inputSchema = z.object({
	actorName: z.string().describe('The name of the actor to delete'),
})

export function registerDeleteActorTool(server: McpServer) {
	server.registerTool(
		TOOL_NAME,
		{
			title: 'Delete Actor',
			description: 'Delete an actor by name from the current world',
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
				const { actorName } = args

				const worldData = await RheaService.getWorldDetails({ worldId, userId })
				const actor = findByName({ name: actorName, entities: worldData.actors })

				await RheaService.deleteActor({
					worldId,
					actorId: actor.id,
					userId,
				})

				Logger.toolSuccess(TOOL_NAME, `Deleted actor: ${actor.name}`)
				return {
					content: [
						{
							type: 'text' as const,
							text: `Actor "${actor.name}" (ID: ${actor.id}) has been deleted successfully.`,
						},
					],
				}
			} catch (error) {
				Logger.toolError(TOOL_NAME, error)
				return {
					content: [
						{
							type: 'text' as const,
							text: `Error deleting actor: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
						},
					],
					isError: true,
				}
			}
		},
	)
}
