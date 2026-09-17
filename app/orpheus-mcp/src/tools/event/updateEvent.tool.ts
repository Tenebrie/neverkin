import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ContextService } from '@src/services/ContextService.js'
import { RheaService } from '@src/services/RheaService.js'
import { findByName } from '@src/utils/findByName.js'
import { formatTimestamp } from '@src/utils/formatTimestamp.js'
import { Logger } from '@src/utils/Logger.js'
import { normalizeColor } from '@src/utils/normalizeColor.js'
import { resolveTimestamp } from '@src/utils/resolveTimestamp.js'
import { getSessionId, ToolExtra } from '@src/utils/toolHelpers.js'
import z from 'zod'

const TOOL_NAME = 'update_event'

const inputSchema = z.object({
	eventName: z.string().describe('The name of the event to update'),
	name: z.string().optional().describe('The new name for the event (optional)'),
	timestamp: z
		.string()
		.optional()
		.describe(
			"The new timestamp of the event in the world calendar's date format (optional). Must match it precisely.",
		),
	color: z
		.string()
		.optional()
		.describe('The new color for the event in RGB hex format, e.g. #bf8a40 (optional)'),
})

export function registerUpdateEventTool(server: McpServer) {
	server.registerTool(
		TOOL_NAME,
		{
			title: 'Update Event',
			description: [
				'Update an existing event by name. Find the event by name and update its properties.',
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
				const { eventName, name, timestamp, color } = args

				const worldData = await RheaService.getWorldDetails({ worldId, userId })
				const event = findByName({ name: eventName, entities: worldData.events })

				const updatedEvent = await RheaService.updateEvent({
					worldId,
					eventId: event.id,
					userId,
					name,
					timestamp: resolveTimestamp(timestamp, worldData),
					color: normalizeColor(color),
				})

				Logger.toolSuccess(TOOL_NAME, `Updated event "${updatedEvent.name}"`)
				return {
					content: [
						{
							type: 'text' as const,
							text:
								`Event updated successfully!\n` +
								`Name: ${updatedEvent.name}\n` +
								`ID: ${updatedEvent.id}\n` +
								`Timestamp: ${formatTimestamp(updatedEvent.timestamp, worldData)}\n` +
								`Color: ${updatedEvent.color || '(None)'}`,
						},
					],
				}
			} catch (error) {
				Logger.toolError(TOOL_NAME, error)
				return {
					content: [
						{
							type: 'text' as const,
							text: `Error updating event: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
						},
					],
					isError: true,
				}
			}
		},
	)
}
