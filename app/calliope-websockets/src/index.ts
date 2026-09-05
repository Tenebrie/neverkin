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
import { YjsHandshakeService } from './services/YjsHandshakeService.js'
import { YjsLineageService } from './services/YjsLineageService.js'
import { recordLastWritingUser, YjsSyncService } from './services/YjsSyncService.js'
import { ClientToCalliopeMessage } from './ts-shared/ClientToCalliopeMessage.js'
import { AUTH_COOKIE_NAME } from './ts-shared/const/constants.js'
import { Logger } from './utils/logger.js'
import { SocketBuffer } from './utils/SocketBuffer.js'

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
		const buffer = new SocketBuffer(ctx.websocket)

		try {
			const authCookie = ctx.cookies.get(AUTH_COOKIE_NAME)
			if (!authCookie) {
				throw new Error('No cookie provided')
			}

			const worldId = ctx.path.split('/')[3]
			const entityType = ctx.path.split('/')[4]
			const documentId = ctx.path.split('/')[5]

			if (!worldId || !entityType || !documentId) {
				throw new Error('Missing worldId, entityType, or documentId')
			}

			if (!['actor', 'event', 'article', 'node'].includes(entityType)) {
				throw new Error('Invalid entityType')
			}

			const docName = `${worldId}:${documentId}`
			const { id: userId } = TokenService.decodeUserToken(authCookie)

			const connection = await YjsSyncService.setupDocumentListener({
				userId,
				worldId,
				entityId: documentId,
				entityType: entityType as 'actor' | 'event' | 'article' | 'node',
				docName,
			})
			const { accessLevel, lineageId } = connection

			const clientStateVector = await YjsHandshakeService.readClientStateVector(buffer)
			if (!clientStateVector) {
				Logger.yjsWarn(docName, `Client sent no sync handshake, declining`)
				ctx.websocket.close(4008, 'No sync handshake')
				await connection.abandon()
				return
			}
			if (!YjsLineageService.isCompatibleClientState(lineageId, clientStateVector)) {
				Logger.yjsWarn(
					docName,
					`Client holds a different lineage (server ${lineageId}, client ${[...clientStateVector.keys()].join(',')}), declining`,
				)
				ctx.websocket.close(4409, 'Document lineage changed')
				await connection.abandon()
				return
			}
			if (!connection.attach(ctx.websocket, ctx.req)) {
				Logger.yjsWarn(docName, `Document was reset while the client was validated, asking it to retry`)
				ctx.websocket.close(4008, 'Document reloaded')
				await connection.abandon()
				return
			}

			if (accessLevel === 'read') {
				const yListeners = ctx.websocket.listeners('message')
				ctx.websocket.removeAllListeners('message')

				ctx.websocket.on('message', (data, isBinary) => {
					const b = Buffer.isBuffer(data) ? data : Buffer.from(data as never)
					if (b[0] === 0 && b[1] > 1) {
						Logger.yjsWarn(
							docName,
							`Read-only user attempted to write to Yjs document (message ${b[0]}${b[1]}). Dropping.`,
						)
					}
					if (b[0] === 0 && b[1] !== 0) {
						return
					}

					for (const listener of yListeners) {
						listener.call(ctx.websocket, data, isBinary)
					}
				})
			} else {
				ctx.websocket.on('message', () => {
					recordLastWritingUser(docName, userId)
				})
			}

			buffer.replay()
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
