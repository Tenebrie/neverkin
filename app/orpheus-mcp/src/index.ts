import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import chalk from 'chalk'
import http from 'http'

import { ContextService } from './services/ContextService.js'
import { OAuthService } from './services/OAuthService.js'
import { RedisService } from './services/RedisService.js'
import { registerCreateActorTool } from './tools/actor/createActor.tool.js'
import { registerDeleteActorTool } from './tools/actor/deleteActor.tool.js'
import { registerUpdateActorTool } from './tools/actor/updateActor.tool.js'
import { registerCreateArticleTool } from './tools/article/createArticle.tool.js'
import { registerDeleteArticleTool } from './tools/article/deleteArticle.tool.js'
import { registerUpdateArticleTool } from './tools/article/updateArticle.tool.js'
import { registerReadmeTool } from './tools/context/readme.tool.js'
import { registerSetContextTool } from './tools/context/setContext.tool.js'
import { registerDeleteEntityContentPageTool } from './tools/entity/deleteEntityContentPage.tool.js'
import { registerGetEntityDetailsTool } from './tools/entity/getEntityDetails.tool.js'
import { registerUpdateEntityContentTool } from './tools/entity/updateEntityContent.tool.js'
import { registerCreateEventTool } from './tools/event/createEvent.tool.js'
import { registerDeleteEventTool } from './tools/event/deleteEvent.tool.js'
import { registerUpdateEventTool } from './tools/event/updateEvent.tool.js'
import { registerCreateTagTool } from './tools/tag/createTag.tool.js'
import { registerDeleteTagTool } from './tools/tag/deleteTag.tool.js'
import { registerGetTagDetailsTool } from './tools/tag/getTagDetails.tool.js'
import { registerUpdateTagTool } from './tools/tag/updateTag.tool.js'
import { registerCreateWorldTool } from './tools/world/createWorld.tool.js'
import { registerGetWorldDetailsTool } from './tools/world/getWorldDetails.tool.js'
import { registerListWorldsTool } from './tools/world/listWorlds.tool.js'
import { registerSearchWorldTool } from './tools/world/searchWorld.tool.js'
import {
	handleAuthorize,
	handleAuthorizePost,
	handleOAuthMetadata,
	handleRegister,
	handleToken,
	validateBearerToken,
} from './utils/oauthHandlers.js'

function createServer() {
	const server = new McpServer(
		{
			name: 'orpheus-mcp',
			version: '0.0.1',
		},
		{
			instructions: ['Call the Readme tool to get started.'].join('\n'),
		},
	)

	// Context tools
	registerReadmeTool(server)
	registerListWorldsTool(server)
	registerSetContextTool(server)
	registerGetWorldDetailsTool(server)
	registerSearchWorldTool(server)
	registerCreateWorldTool(server)

	// Entity content tools (actor, event, article)
	registerGetEntityDetailsTool(server)
	registerUpdateEntityContentTool(server)
	registerDeleteEntityContentPageTool(server)

	// Actor tools
	registerCreateActorTool(server)
	registerUpdateActorTool(server)
	registerDeleteActorTool(server)

	// Event tools
	registerCreateEventTool(server)
	registerUpdateEventTool(server)
	registerDeleteEventTool(server)

	// Article tools
	registerCreateArticleTool(server)
	registerUpdateArticleTool(server)
	registerDeleteArticleTool(server)

	// Tag tools
	registerGetTagDetailsTool(server)
	registerCreateTagTool(server)
	registerUpdateTagTool(server)
	registerDeleteTagTool(server)

	return server
}

/**
 * Bind a fresh transport to a session that was initialized on a previous run or
 * another instance. The MCP SDK exposes no public API for this, so the internal
 * "initialized" flag and session id are set directly.
 */
function adoptExistingSession(transport: StreamableHTTPServerTransport, sessionId: string): void {
	const internal = (
		transport as unknown as {
			_webStandardTransport: { _initialized: boolean; sessionId?: string }
		}
	)._webStandardTransport
	internal._initialized = true
	internal.sessionId = sessionId
}

async function main() {
	await RedisService.connect()

	// Track active transports by session ID
	const transports = new Map<string, StreamableHTTPServerTransport>()

	// Drop the local transport when it closes (e.g. process reload) but keep the
	// session in Redis so it can be resumed.
	function forgetLocalTransportOnClose(transport: StreamableHTTPServerTransport, sessionId: string) {
		transport.onclose = () => {
			if (transports.get(sessionId) === transport) {
				transports.delete(sessionId)
			}
		}
	}

	// The client explicitly terminated the session (DELETE): forget it everywhere.
	async function endSession(sessionId: string) {
		transports.delete(sessionId)
		await ContextService.removeSession(sessionId)
		console.info(`Session closed: ${sessionId}`)
	}

	const httpServer = http.createServer(async (req, res) => {
		const url = new URL(req.url || '/', `http://localhost:3002`)

		// CORS headers for web access
		res.setHeader('Access-Control-Allow-Origin', '*')
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id, Authorization')
		res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id')

		if (req.method === 'OPTIONS') {
			res.writeHead(204)
			res.end()
			return
		}

		if (url.pathname === '/orpheus/health') {
			res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
			res.end('OK')
			return
		}

		// OAuth 2.1 endpoints for Claude.ai remote MCP connection
		if (url.pathname === '/.well-known/oauth-authorization-server') {
			handleOAuthMetadata(req, res)
			return
		}

		// Dynamic Client Registration (RFC 7591)
		if (url.pathname === '/register' && req.method === 'POST') {
			await handleRegister(req, res)
			return
		}

		// Authorization endpoint
		if (url.pathname === '/authorize') {
			if (req.method === 'GET') {
				await handleAuthorize(req, res)
			} else if (req.method === 'POST') {
				await handleAuthorizePost(req, res)
			}
			return
		}

		// Token endpoint
		if (url.pathname === '/token' && req.method === 'POST') {
			await handleToken(req, res)
			return
		}

		if (url.pathname === '/mcp') {
			// Try to validate OAuth token (use it if provided, require it if enforced)
			const authenticatedUserId: string | null = await validateBearerToken(req)
			if (OAuthService.loginEnforced() && !authenticatedUserId) {
				res.writeHead(401, { 'Content-Type': 'application/json' })
				res.end(JSON.stringify({ error: 'unauthorized', error_description: 'Valid Bearer token required' }))
				return
			}
			if (authenticatedUserId) {
				console.info(`Authenticated request from user: ${authenticatedUserId}`)
			}

			const sessionId = req.headers['mcp-session-id'] as string | undefined

			// If we have a session ID, try to find existing transport
			if (sessionId && transports.has(sessionId)) {
				const transport = transports.get(sessionId)!
				await transport.handleRequest(req, res)
				return
			}

			// For new sessions (POST without session ID = initialize)
			if (req.method === 'POST' && !sessionId) {
				const transport = new StreamableHTTPServerTransport({
					sessionIdGenerator: () => crypto.randomUUID(),
					onsessioninitialized: async (newSessionId) => {
						forgetLocalTransportOnClose(transport, newSessionId)
						transports.set(newSessionId, transport)
						await ContextService.createSession(newSessionId, authenticatedUserId)
						console.info(`New session initialized: ${newSessionId}`)
						if (authenticatedUserId) {
							console.info(`Session ${newSessionId} linked to user: ${authenticatedUserId}`)
						}
					},
					onsessionclosed: endSession,
				})

				const server = createServer()
				await server.connect(transport)
				await transport.handleRequest(req, res)
				return
			}

			// Session from Redis
			if (sessionId && (await ContextService.sessionExists(sessionId))) {
				const transport = new StreamableHTTPServerTransport({
					sessionIdGenerator: () => sessionId,
					onsessionclosed: endSession,
				})
				adoptExistingSession(transport, sessionId)
				forgetLocalTransportOnClose(transport, sessionId)
				transports.set(sessionId, transport)

				const server = createServer()
				await server.connect(transport)
				await transport.handleRequest(req, res)
				console.info(`Session resumed: ${sessionId}`)
				return
			}

			// Genuinely unknown session: tell the client to re-initialize
			if (sessionId) {
				res.writeHead(404, { 'Content-Type': 'application/json' })
				res.end(
					JSON.stringify({
						jsonrpc: '2.0',
						error: { code: -32001, message: 'Session not found' },
						id: null,
					}),
				)
				return
			}

			// Session ID required but not found
			res.writeHead(400, { 'Content-Type': 'application/json' })
			res.end(JSON.stringify({ error: 'Invalid or missing session ID' }))
		} else if (url.pathname === '/health') {
			res.writeHead(200, { 'Content-Type': 'application/json' })
			res.end(JSON.stringify({ status: 'ok' }))
			// res.end(JSON.stringify({ status: 'ok', transport: 'streamable-http', sessions: transports.size }))
		} else {
			res.writeHead(404, { 'Content-Type': 'application/json' })
			res.end(JSON.stringify({ error: 'Not found' }))
		}
	})

	httpServer.listen(3002, () => {
		const endpoints = ['http://localhost:3002/mcp', 'http://orpheus:3002/mcp']
		console.info(`${chalk.greenBright('[Orpheus]')} Listening on port ${chalk.blueBright('3002')}`)
		console.info(`  MCP endpoints: ${chalk.blueBright(endpoints[0])} | ${chalk.blueBright(endpoints[1])}`)
		console.info(`  OAuth required: ${chalk.cyan(OAuthService.loginEnforced())}`)
	})
}

main().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
