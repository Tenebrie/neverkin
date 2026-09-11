import { Logger } from '@src/utils/logger.js'
import { SocketBuffer } from '@src/utils/SocketBuffer.js'
import { IncomingMessage } from 'http'
import { WebSocket } from 'ws'

import { YjsHandshakeService } from './YjsHandshakeService.js'
import { YjsLineageService } from './YjsLineageService.js'
import { DocumentMetadata, recordLastWritingUser, YjsSyncService } from './YjsSyncService.js'

export const YjsConnectionService = {
	/**
	 * Validate a client against the live document and hand the socket to y-websocket-server.
	 * Frames that arrive while validating are held and replayed once the socket is attached.
	 */
	connect: async ({
		socket,
		req,
		userId,
		worldId,
		entityType,
		documentId,
	}: {
		socket: WebSocket
		req: IncomingMessage
		userId: string
		worldId: string
		entityType: DocumentMetadata['entityType']
		documentId: string
	}) => {
		const buffer = new SocketBuffer(socket)
		const docName = `${worldId}:${documentId}`

		const connection = await YjsSyncService.setupDocumentListener({
			userId,
			worldId,
			entityId: documentId,
			entityType,
			docName,
		})
		const { accessLevel, lineageId } = connection
		let isAttached = false

		try {
			const clientStateVector = await YjsHandshakeService.readClientStateVector(buffer)
			if (!clientStateVector) {
				Logger.yjsWarn(docName, `Client sent no sync handshake, declining`)
				socket.close(4008, 'No sync handshake')
				return
			}
			if (!YjsLineageService.isCompatibleClientState(lineageId, clientStateVector)) {
				Logger.yjsWarn(
					docName,
					`Client holds a different lineage (server ${lineageId}, client ${[...clientStateVector.keys()].join(',')}), declining`,
				)
				socket.close(4409, 'Document lineage changed')
				return
			}
			isAttached = connection.attach(socket, req)
			if (!isAttached) {
				Logger.yjsWarn(docName, `Document was reset while the client was validated, asking it to retry`)
				socket.close(4008, 'Document reloaded')
				return
			}

			if (accessLevel === 'read') {
				const yListeners = socket.listeners('message')
				socket.removeAllListeners('message')

				socket.on('message', (data, isBinary) => {
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
						listener.call(socket, data, isBinary)
					}
				})
			} else {
				socket.on('message', () => {
					recordLastWritingUser(docName, userId)
				})
			}

			buffer.replay()
		} finally {
			if (!isAttached) {
				await connection.abandon()
			}
		}
	},
}
