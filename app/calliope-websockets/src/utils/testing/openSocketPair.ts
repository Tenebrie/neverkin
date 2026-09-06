import { IncomingMessage } from 'http'
import { WebSocket, WebSocketServer } from 'ws'

export type SocketPair = {
	server: WebSocket
	req: IncomingMessage
	client: WebSocket
	close: () => Promise<void>
}

/**
 * A real server-side `ws` socket with a connected client, for tests that hand sockets to y-websocket-server.
 */
export async function openSocketPair(): Promise<SocketPair> {
	const wss = new WebSocketServer({ port: 0 })
	await new Promise<void>((resolve) => wss.once('listening', resolve))
	const address = wss.address()
	if (!address || typeof address === 'string') {
		throw new Error(`Unexpected server address: ${address}`)
	}

	const accepted = new Promise<[WebSocket, IncomingMessage]>((resolve) =>
		wss.once('connection', (socket, req) => resolve([socket, req])),
	)
	const client = new WebSocket(`ws://127.0.0.1:${address.port}`)
	const opened = new Promise<void>((resolve) => client.once('open', resolve))
	const [server, req] = await accepted
	await opened

	return {
		server,
		req,
		client,
		close: async () => {
			client.terminate()
			server.terminate()
			await new Promise<void>((resolve) => wss.close(() => resolve()))
		},
	}
}

export function closedWith(socket: WebSocket): Promise<{ code: number; reason: string }> {
	return new Promise((resolve) =>
		socket.once('close', (code, reason) => resolve({ code, reason: reason.toString() })),
	)
}
