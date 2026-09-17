import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ContextService } from '@src/services/ContextService.js'
import { RheaService } from '@src/services/RheaService.js'
import { findByNameOrCreate } from '@src/utils/findByName.js'
import { Logger } from '@src/utils/Logger.js'
import { replaceOnce } from '@src/utils/replaceOnce.js'
import { CONTENT_ENTITY_TYPES, resolveEntityByName } from '@src/utils/resolveEntityByName.js'
import { resolveShorthandMentions } from '@src/utils/resolveShorthandMentions.js'
import { toAgentReadableText } from '@src/utils/toAgentReadableText.js'
import { getSessionId, ToolExtra } from '@src/utils/toolHelpers.js'
import z from 'zod'

const TOOL_NAME = 'update_entity_content'

type ContentOperation =
	| { set: string; replace?: undefined }
	| { set?: undefined; replace: { oldString: string; newString: string } }

const inputSchema = z
	.object({
		entityName: z.string().describe('The name of the actor, event or article to update'),
		entityType: z
			.enum(CONTENT_ENTITY_TYPES)
			.optional()
			.describe('Only needed when the name is ambiguous across entity types.'),
		pageName: z
			.string()
			.optional()
			.describe('The content page to create or update, if not provided, the main content will be updated'),
		set: z
			.string()
			.optional()
			.describe('The new full page content in HTML format. Fully replaces the old content.'),
		replace: z
			.object({
				oldString: z.string().min(1).describe('The old content to replace. Must appear exactly once.'),
				newString: z.string().describe('The new content to replace the old content.'),
			})
			.optional()
			.describe('Replaces a unique snippet of the current content, leaving the rest untouched.'),
	})
	.refine(
		(args): args is typeof args & ContentOperation =>
			(args.set !== undefined) !== (args.replace !== undefined),
		'Provide exactly one of "set" or "replace".',
	)

export function registerUpdateEntityContentTool(server: McpServer) {
	server.registerTool(
		TOOL_NAME,
		{
			title: 'Update Entity Content',
			description: [
				'Updates the content of an actor, event or article.',
				"Use pageName to target a specific page - creates it if it doesn't exist.",
				'Without pageName, updates main content.',
				'Provide exactly one of "set" (full replacement) or "replace" (edit a unique snippet in place).',

				'To mention another entity in content, use the following syntax:',
				'@[Entity Name]',
				'It will be automatically resolved into an HTML tag.',

				'Content is HTML. Use <p>, <ul>, <li>, <b> etc.',
				'Mentions link entities together and show up in "Mentions" and "Mentioned in" fields.',

				'',
			].join('\n'),
			inputSchema,
		},
		async (args: z.infer<typeof inputSchema>, extra: ToolExtra) => {
			try {
				const sessionId = getSessionId(extra)
				Logger.toolInvocation(TOOL_NAME, args)

				const worldId = await ContextService.getCurrentWorldOrThrow(sessionId)
				const userId = await ContextService.getCurrentUserIdOrThrow(sessionId)
				const { entityName, entityType, pageName } = args

				const worldData = await RheaService.getWorldDetails({ worldId, userId })
				const articleData = await RheaService.getWorldArticles({ userId, worldId })
				const { type, entity } = resolveEntityByName({
					name: entityName,
					types: entityType ? [entityType] : CONTENT_ENTITY_TYPES,
					worldData,
					articleData,
				})

				const result: string[] = []
				const page = pageName
					? await findByNameOrCreate({
							name: pageName,
							entities: entity.pages,
							onCreate: async () => {
								const newPage = await RheaService.createEntityContentPage({
									entityType: type,
									worldId,
									entityId: entity.id,
									userId,
									pageName,
								})
								result.push(`Page "${newPage.name}" has been created.`)
								return newPage
							},
						})
					: undefined

				const content = await (async () => {
					if (args.set !== undefined) {
						return args.set
					}
					const current = await RheaService.getEntityContent({
						entityType: type,
						worldId,
						entityId: entity.id,
						userId,
						pageId: page?.id,
					})
					return replaceOnce({
						content: toAgentReadableText({ content: current.contentHtml ?? '' }),
						...args.replace,
					})
				})()

				const parsedContent = await resolveShorthandMentions({
					content,
					worldData,
					articleData,
				})

				if (page) {
					await RheaService.updateEntityContentPage({
						entityType: type,
						worldId,
						entityId: entity.id,
						userId,
						content: parsedContent,
						pageId: page.id,
					})
					result.push(`Page "${page.name}" has been updated.`)
				} else {
					await RheaService.updateEntityContent({
						entityType: type,
						worldId,
						entityId: entity.id,
						userId,
						content: parsedContent,
					})
					result.push(`Main content has been updated.`)
				}

				Logger.toolSuccess(TOOL_NAME, `Updated ${type} content: ${entity.name}`)
				return {
					content: result.map((message) => ({
						type: 'text' as const,
						text: message,
					})),
				}
			} catch (error) {
				Logger.toolError(TOOL_NAME, error)
				return {
					content: [
						{
							type: 'text' as const,
							text: `Error updating entity content: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
						},
					],
					isError: true,
				}
			}
		},
	)
}
