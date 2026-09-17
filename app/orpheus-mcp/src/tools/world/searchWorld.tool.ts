import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ContextService } from '@src/services/ContextService.js'
import { RheaService } from '@src/services/RheaService.js'
import { findByName } from '@src/utils/findByName.js'
import { formatTimestamp } from '@src/utils/formatTimestamp.js'
import { Logger } from '@src/utils/Logger.js'
import { resolveTimestamp } from '@src/utils/resolveTimestamp.js'
import { getSessionId, ToolExtra } from '@src/utils/toolHelpers.js'
import { toSummary } from '@src/utils/toSummary.js'
import z from 'zod'

const TOOL_NAME = 'search_world'

const inputSchema = z.object({
	query: z
		.string()
		.optional()
		.describe(
			'The search query to find events, actors, and articles. Split by space. If omitted, will search all entities.',
		),
	from: z
		.string()
		.optional()
		.describe(
			"Timestamp in the world calendar's date format (events only). Will only search events after it.",
		),
	to: z
		.string()
		.optional()
		.describe(
			"Timestamp in the world calendar's date format (events only). Will only search events before it.",
		),
	before: z.string().optional().describe('Event name. Will only search events before this one.'),
	after: z.string().optional().describe('Event name. Will only search events after this one.'),
})

export function registerSearchWorldTool(server: McpServer) {
	server.registerTool(
		TOOL_NAME,
		{
			title: 'Search World',
			description: 'Search for events, actors, and articles in the current world',
			inputSchema,
			annotations: {
				readOnlyHint: true,
				idempotentHint: true,
			},
		},
		async (args, extra: ToolExtra) => {
			try {
				const sessionId = getSessionId(extra)
				Logger.toolInvocation(TOOL_NAME, { query: args.query })

				const worldId = await ContextService.getCurrentWorldOrThrow(sessionId)
				const userId = await ContextService.getCurrentUserIdOrThrow(sessionId)

				if (args.from && args.after) {
					throw new Error('Cannot search for both "from" and "after" (both set the start of the range)')
				}
				if (args.to && args.before) {
					throw new Error('Cannot search for both "to" and "before" (both set the end of the range)')
				}

				const worldData = await RheaService.getWorldDetails({ worldId, userId })
				const minTime = (() => {
					if (args.after) {
						const event = findByName({ name: args.after, entities: worldData.events })
						return Number(event.timestamp)
					}
					if (args.from) {
						return resolveTimestamp(args.from, worldData)
					}
					return undefined
				})()
				const maxTime = (() => {
					if (args.before) {
						const event = findByName({ name: args.before, entities: worldData.events })
						return Number(event.timestamp)
					}
					if (args.to) {
						return resolveTimestamp(args.to, worldData)
					}
					return undefined
				})()
				if (minTime && maxTime && minTime > maxTime) {
					throw new Error('Minimum time must be before maximum time')
				}

				const data = await RheaService.searchWorld({
					worldId,
					query: args.query ?? '*',
					userId,
					timeRange: {
						from: minTime,
						to: maxTime,
					},
				})

				const summaryThreshold = 10
				const totalResults = data.actors.length + data.articles.length + data.events.length + data.tags.length
				const showSummary = totalResults <= summaryThreshold

				const formatResults = (
					items: Array<{
						id: string
						name: string
						title?: string
						timestamp?: string
						description?: string
						contentRich?: string
					}>,
					type: string,
				) => {
					if (items.length === 0) return `No ${type} found`
					return items
						.map((item) => {
							const firstLine = `- ${item.name}${item.title ? `, "${item.title}` : ''}${item.timestamp ? ` (${formatTimestamp(item.timestamp, worldData)})` : ''}`
							if (!showSummary) {
								return firstLine
							}
							const contentLine = item.contentRich ?? item.description ?? ''
							return `${firstLine}\n${toSummary(contentLine)}\n`
						})
						.join('\n')
						.trim()
				}

				const content = [
					`Search results for "${args.query ?? '*'}":`,
					'',
					'**Events:**',
					formatResults(data.events, 'events'),
					'',
					'**Actors:**',
					formatResults(data.actors, 'actors'),
					'',
					'**Articles:**',
					formatResults(data.articles, 'articles'),
					'',
					'**Tags:**',
					formatResults(data.tags, 'tags'),
					'',
					showSummary ? '' : `More than ${summaryThreshold} results found, entity summaries not shown.`,
				]
					.join('\n')
					.trim()

				Logger.toolSuccess(TOOL_NAME, `Found ${totalResults} results for query "${args.query}"`)

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
							text: `Error searching world: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
						},
					],
					isError: true,
				}
			}
		},
	)
}
