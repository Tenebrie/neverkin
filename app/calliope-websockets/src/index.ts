import chalk from 'chalk'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import route from 'koa-route'
import websocketify from 'koa-websocket'
import { WebSocket } from 'ws'

import { ClientMessageHandlerService } from './services/ClientMessageHandlerService.js'
import { persistenceLeaderService } from './services/PersistenceLeaderService.js'
import { initRedisConnection } from './services/RedisService.js'
import { TokenService } from './services/TokenService.js'
import { WebsocketService } from './services/WebsocketService.js'
import { YjsConnectionService } from './services/YjsConnectionService.js'
import { YJS_ENTITY_TYPES, YjsSyncService } from './services/YjsSyncService.js'
import { ClientToCalliopeMessage } from './ts-shared/ClientToCalliopeMessage.js'
import { AUTH_COOKIE_NAME } from './ts-shared/const/constants.js'

const app = websocketify(new Koa())

app.ws.use(
	route.all('/live/:sessionId', function (ctx) {
		try {
			const authCookie = ctx.cookies.get(AUTH_COOKIE_NAME)
			if (!authCookie) {
				throw new Error('No cookie provided')
			}

			const { id: userId } = TokenService.decodeUserToken(authCookie)
			const sessionId = ctx.path.split('/')[2]
			if (!sessionId) {
				throw new Error('No session id')
			}

			const socket = ctx.websocket as WebSocket
			socket.on('message', async (rawMessage) => {
				try {
					const message = JSON.parse(rawMessage.toString()) as ClientToCalliopeMessage
					await ClientMessageHandlerService.handleMessage(message, userId, sessionId, ctx.websocket)
				} catch (e) {
					console.error('Error handling message', e)
				}
			})
			socket.on('close', () => {
				WebsocketService.unregisterSocket(userId, ctx.websocket)
			})
			socket.on('error', () => {
				WebsocketService.unregisterSocket(userId, ctx.websocket)
			})
		} catch (e) {
			console.error('Error establishing websocket session:', e)
			ctx.websocket.close(4500, 'Error establishing socket')
		}
	}),
)

app.ws.use(
	route.all('/live/yjs/:worldId/:entityType/:documentId', async function (ctx) {
		try {
			const authCookie = ctx.cookies.get(AUTH_COOKIE_NAME)
			if (!authCookie) {
				throw new Error('No cookie provided')
			}

			const worldId = ctx.path.split('/')[3]
			const entityTypeSegment = ctx.path.split('/')[4]
			const documentId = ctx.path.split('/')[5]

			if (!worldId || !entityTypeSegment || !documentId) {
				throw new Error('Missing worldId, entityType, or documentId')
			}

			const entityType = YJS_ENTITY_TYPES.find((type) => type === entityTypeSegment)
			if (!entityType) {
				throw new Error('Invalid entityType')
			}

			const { id: userId } = TokenService.decodeUserToken(authCookie)

			await YjsConnectionService.connect({
				socket: ctx.websocket,
				req: ctx.req,
				userId,
				worldId,
				entityType,
				documentId,
			})
		} catch (e) {
			console.error('Error establishing Yjs websocket:', e)
			ctx.websocket.close(4500, 'Error establishing socket')
		}
	}),
)

app.ws.use(
	route.all('(.*)', async function (ctx) {
		console.warn(`Rejected WebSocket connection to invalid path: ${ctx.path}`)
		ctx.websocket.close(4404, `Invalid path: ${ctx.path}`)
	}),
)

app.use(async (ctx, next) => {
	if (ctx.path === '/calliope/health') {
		ctx.set('Content-Type', 'text/plain; charset=utf-8')
		ctx.status = 200
		ctx.body = 'OK'
	} else {
		await next()
	}
})

app.use(
	bodyParser({
		enableTypes: ['text', 'json', 'form'],
	}),
)

initRedisConnection()
YjsSyncService.setupGlobalHooks()
persistenceLeaderService.connect()

const server = app.listen(3001)
console.info(`${chalk.greenBright('[Calliope]')} Listening on port ${chalk.blueBright('3001')}`)

let isShuttingDown = false
const shutdown = async () => {
	if (isShuttingDown) {
		return
	}
	isShuttingDown = true
	console.info('Shutting down gracefully...')
	await YjsSyncService.flushAllDocuments()
	await persistenceLeaderService.shutdown()
	server.close()
	process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
