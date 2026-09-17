import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ContextService } from '@src/services/ContextService.js'
import { OAuthService } from '@src/services/OAuthService.js'
import { RheaService } from '@src/services/RheaService.js'
import { Logger } from '@src/utils/Logger.js'
import { getSessionId, ToolExtra } from '@src/utils/toolHelpers.js'
import z from 'zod'

const TOOL_NAME = 'list_worlds'

const inputSchema = z.object({
	userId: z.string().describe('The ID of the user to list worlds for. Local dev only.').optional(),
})

export function registerListWorldsTool(server: McpServer) {
	server.registerTool(
		TOOL_NAME,
		{
			title: 'List Worlds',
			description: 'List all worlds (projects) the current user has access to.',
			inputSchema,
			annotations: {
				readOnlyHint: true,
				idempotentHint: true,
			},
		},
		async (args, extra: ToolExtra) => {
			try {
				const sessionId = getSessionId(extra)
				Logger.toolInvocation(TOOL_NAME, { ...args, sessionId })

				if (args.userId && OAuthService.loginEnforced()) {
					throw new Error('OAuth login required')
				}

				const userId = args.userId ?? (await ContextService.getCurrentUserIdOrThrow(sessionId))
				const data = await RheaService.listWorlds(userId)
				await ContextService.setCurrentUserId(sessionId, userId)

				const worlds = [...data.ownedWorlds, ...data.contributableWorlds, ...data.visibleWorlds].map((w) => ({
					id: w.id,
					name: w.name,
					accessMode: w.accessMode,
					calendar: w.calendars[0].name + ' :: Timestamp format is "' + w.calendars[0].dateFormat + '"',
				}))

				const worldList = worlds
					.map(
						(w) =>
							`${w.name}\n` + `  ID: ${w.id}\n` + `  Access: ${w.accessMode}\n` + `  Calendar: ${w.calendar}`,
					)
					.join('\n\n')
				Logger.toolSuccess(TOOL_NAME, `Found ${worlds.length} worlds`)

				if (worlds.length === 1) {
					await ContextService.setCurrentWorld(sessionId, worlds[0].id)
					return {
						content: [
							{
								type: 'text' as const,
								text: `Your worlds:\n${worldList || 'No worlds found'}`,
							},
							{
								type: 'text' as const,
								text: `As there is only one world, it has been automatically set as current context. Run the readme tool before creating or editing content — it covers conventions you can't infer from the tool descriptions.`,
							},
						],
					}
				}

				return {
					content: [
						{
							type: 'text' as const,
							text: `Your worlds:\n${worldList || 'No worlds found'}`,
						},
						{
							type: 'text' as const,
							text: `Run the readme tool before creating or editing content — it covers conventions you can't infer from the tool descriptions. Then, use set_context to set the working project (world).`,
						},
					],
				}
			} catch (error) {
				Logger.toolError(TOOL_NAME, error)
				return {
					content: [
						{
							type: 'text' as const,
							text: `Error fetching worlds: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
						},
					],
					isError: true,
				}
			}
		},
	)
}
