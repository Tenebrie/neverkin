import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ContextService } from '@src/services/ContextService.js'
import { RheaService } from '@src/services/RheaService.js'
import { formatTimestamp } from '@src/utils/formatTimestamp.js'
import { Logger } from '@src/utils/Logger.js'
import { formatUnitReminder } from '@src/utils/resolveTimestamp.js'
import { getSessionId, ToolExtra } from '@src/utils/toolHelpers.js'

const TOOL_NAME = 'get_world_details'

export function registerGetWorldDetailsTool(server: McpServer) {
	server.registerTool(
		TOOL_NAME,
		{
			title: 'Get World Details',
			description:
				'Get details about the current world (events, actors, articles). Use this to get overview of the stuff you have access to.',
			annotations: {
				readOnlyHint: true,
				idempotentHint: true,
			},
		},
		async (extra: ToolExtra) => {
			try {
				const sessionId = getSessionId(extra)
				Logger.toolInvocation(TOOL_NAME, {})

				const worldId = await ContextService.getCurrentWorldOrThrow(sessionId)
				const userId = await ContextService.getCurrentUserIdOrThrow(sessionId)

				const baseData = await RheaService.getWorldDetails({ worldId, userId })
				const articles = await RheaService.getWorldArticles({ worldId, userId })
				const calendar = baseData.calendars[0]

				const content =
					`Events: ${baseData.events.map((e) => e.name).join(', ') || 'None'}\n` +
					`Actors: ${baseData.actors.map((a) => `${a.name} (${a.title})`).join(', ') || 'None'}\n` +
					`Articles: ${articles.map((a) => a.name).join(', ') || 'None'}\n` +
					`Tags: ${baseData.tags.map((t) => t.name).join(', ') || 'None'}\n` +
					`Read-Only: ${baseData.isReadOnly ? 'Yes' : 'No'}\n` +
					`Calendar:\n` +
					`  Name: ${calendar.name}\n` +
					`  Date format: ${calendar.dateFormat}\n` +
					`  Origin time: ${formatTimestamp(0, baseData)}\n` +
					`  Time units:\n` +
					`${formatUnitReminder(calendar, { prefix: '    ' })}`

				Logger.toolSuccess(TOOL_NAME, `Retrieved details for world ${worldId}`)
				return {
					content: [
						{
							type: 'text' as const,
							text: content,
						},
					],
				}
			} catch (error) {
				Logger.toolError(TOOL_NAME, error)
				return {
					content: [
						{
							type: 'text' as const,
							text: `Error fetching world details: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
						},
					],
					isError: true,
				}
			}
		},
	)
}
