import { WebSocket } from 'ws'

type Frame = { data: Buffer | ArrayBuffer | Buffer[]; isBinary: boolean }

/**
 * Takes over a socket's incoming frames and holds them until `replay` hands them
 * to whatever listeners have been attached in the meantime.
 */
export class SocketBuffer {
	private held: Frame[] = []
	private arrivals: (() => void)[] = []
	private isHolding = true

	constructor(private readonly socket: Pick<WebSocket, 'onmessage' | 'emit'>) {
		socket.onmessage = (event) => {
			if (!this.isHolding) {
				return
			}
			const data = event.data as Buffer | ArrayBuffer | Buffer[]
			this.held.push({ data, isBinary: typeof event.data !== 'string' })
			this.arrivals.splice(0).forEach((notify) => notify())
		}
	}

	get frames(): Buffer[] {
		return this.held.map((frame) => toBuffer(frame.data))
	}

	nextFrame(): Promise<void> {
		return new Promise((resolve) => this.arrivals.push(resolve))
	}

	replay() {
		this.isHolding = false
		for (const frame of this.held) {
			this.socket.emit('message', frame.data, frame.isBinary)
		}
		this.held = []
	}
}

function toBuffer(data: Buffer | ArrayBuffer | Buffer[]): Buffer {
	if (Buffer.isBuffer(data)) {
		return data
	}
	if (Array.isArray(data)) {
		return Buffer.concat(data)
	}
	return Buffer.from(data)
}
