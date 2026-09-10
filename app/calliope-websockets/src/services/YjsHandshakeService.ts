import { SocketBuffer } from '@src/utils/SocketBuffer.js'
import * as decoding from 'lib0/decoding'
import * as Y from 'yjs'

const MESSAGE_SYNC = 0
const SYNC_STEP_1 = 0
const HANDSHAKE_TIMEOUT_MS = 5000

export const YjsHandshakeService = {
	/**
	 * Decode the state vector from a y-websocket sync step 1 frame. Returns null for any other frame.
	 */
	decodeSyncStep1: (frame: Uint8Array): Map<number, number> | null => {
		const decoder = decoding.createDecoder(frame)
		if (decoding.readVarUint(decoder) !== MESSAGE_SYNC || decoding.readVarUint(decoder) !== SYNC_STEP_1) {
			return null
		}
		return Y.decodeStateVector(decoding.readVarUint8Array(decoder))
	},

	/**
	 * The client's state vector from the first sync step 1 in the buffer, waiting for it to
	 * arrive if needed. Null if none arrives in time.
	 */
	readClientStateVector: async (
		buffer: SocketBuffer,
		timeoutMs = HANDSHAKE_TIMEOUT_MS,
	): Promise<Map<number, number> | null> => {
		const deadline = Date.now() + timeoutMs
		for (;;) {
			for (const frame of buffer.frames) {
				const stateVector = YjsHandshakeService.decodeSyncStep1(frame)
				if (stateVector) {
					return stateVector
				}
			}
			const arrived = await nextFrameBefore(buffer, deadline)
			if (!arrived) {
				return null
			}
		}
	},
}

function nextFrameBefore(buffer: SocketBuffer, deadline: number): Promise<boolean> {
	return new Promise((resolve) => {
		const timer = setTimeout(() => resolve(false), Math.max(0, deadline - Date.now()))
		buffer.nextFrame().then(() => {
			clearTimeout(timer)
			resolve(true)
		})
	})
}
