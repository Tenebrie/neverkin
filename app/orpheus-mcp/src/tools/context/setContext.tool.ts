import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js'
import { ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types.js'
import { ContextService } from '@src/services/ContextService.js'
import { OAuthService } from '@src/services/OAuthService.js'
import { RheaService } from '@src/services/RheaService.js'
import { Logger } from '@src/utils/Logger.js'
import { z } from 'zod'

const TOOL_NAME = 'set_context'

const inputSchema = z.object({
	userId: z.string().describe('The ID of the user to set as the current context').optional(),
	worldId: z.string().describe('The ID of the world to set as the current context'),
})

export function registerSetContextTool(server: McpServer) {
	server.registerTool(
		TOOL_NAME,
		{
			title: 'Set Context',
			description:
				'Set the world ID for this session. Use list_worlds to see available worlds, then set_context to select one to work in.',
			inputSchema,
			annotations: {
				idempotentHint: true,
			},
		},
		async (
			args: z.infer<typeof inputSchema>,
			extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
		) => {
			try {
				const sessionId = extra.sessionId ?? 'default'
				Logger.toolInvocation(TOOL_NAME, { ...args, sessionId })

				if (args.userId && OAuthService.loginEnforced()) {
					throw new Error('OAuth login required')
				}

				const { userId, worldId } = args
				if (userId) {
					await ContextService.setCurrentUserId(sessionId, userId)
				}

				const currentUserId = await ContextService.getCurrentUserIdOrThrow(sessionId)
				// Verify the world exists and user has access
				const worldData = await RheaService.getWorldDetails({ worldId, userId: currentUserId })

				// Set the world in context
				await ContextService.setCurrentWorld(sessionId, worldId)

				Logger.toolSuccess(TOOL_NAME, `Context set to world "${worldData.name}" (${worldId})`)

				return {
					content: [
						{
							type: 'text' as const,
							text:
								`Context set successfully!\n` +
								`Current world: "${worldData.name}" (ID: ${worldId})\n` +
								`You can now use any other tools to work with the world!`,
						},
					],
				}
			} catch (error) {
				Logger.toolError(TOOL_NAME, error)
				return {
					content: [
						{
							type: 'text' as const,
							text: `Error setting context: ${error instanceof Error ? error.message : JSON.stringify(error)}. Make sure the world exists and you have access to it.`,
						},
					],
					isError: true,
				}
			}
		},
	)
}
