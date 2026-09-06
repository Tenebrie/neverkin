import { IncomingMessage } from 'http'
import { afterEach } from 'vitest'
import { WebSocket, WebSocketServer } from 'ws'

export type SocketPair = {
	server: WebSocket
	req: IncomingMessage
	client: WebSocket
	close: () => Promise<void>
}

/**
 * Real `ws` sockets for tests that hand a server-side socket to y-websocket-server.
 * Every pair opened during a test is closed after it.
 */
export function setupSocketPairs() {
	const open: SocketPair[] = []

	afterEach(async () => {
		await Promise.all(open.splice(0).map((pair) => pair.close()))
	})

	return async (): Promise<SocketPair> => {
		const pair = await openSocketPair()
		open.push(pair)
		return pair
	}
}

export function closedWith(socket: WebSocket): Promise<{ code: number; reason: string }> {
	return new Promise((resolve) =>
		socket.once('close', (code, reason) => resolve({ code, reason: reason.toString() })),
	)
}

async function openSocketPair(): Promise<SocketPair> {
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
