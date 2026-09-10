import { awarenessFrame, stateVector, syncStep1Frame, updateFrame } from '@src/test-utils/yjs.js'
import { SocketBuffer } from '@src/utils/SocketBuffer.js'
import { EventEmitter } from 'events'
import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'

import { YjsHandshakeService } from './YjsHandshakeService.js'

describe('YjsHandshakeService - decodeSyncStep1', () => {
	it('decodes the state vector from a sync step 1 frame', () => {
		const doc = new Y.Doc()
		doc.getText('t').insert(0, 'hello')
		expect(YjsHandshakeService.decodeSyncStep1(syncStep1Frame(doc))).toEqual(stateVector(doc))
	})

	it('decodes an empty state vector from a fresh doc', () => {
		expect(YjsHandshakeService.decodeSyncStep1(syncStep1Frame(new Y.Doc()))).toEqual(new Map())
	})

	it('returns null for an awareness frame', () => {
		expect(YjsHandshakeService.decodeSyncStep1(awarenessFrame())).toBeNull()
	})

	it('returns null for a sync update frame', () => {
		const doc = new Y.Doc()
		doc.getText('t').insert(0, 'x')
		expect(YjsHandshakeService.decodeSyncStep1(updateFrame(Y.encodeStateAsUpdate(doc)))).toBeNull()
	})
})

describe('YjsHandshakeService - readClientStateVector', () => {
	it('reads a step 1 that was already buffered', async () => {
		const { socket, buffer } = fakeSocket()
		const doc = new Y.Doc()
		doc.getText('t').insert(0, 'hello')
		socket.receive(syncStep1Frame(doc))

		expect(await YjsHandshakeService.readClientStateVector(buffer, 50)).toEqual(stateVector(doc))
	})

	it('waits for a step 1 that arrives later', async () => {
		const { socket, buffer } = fakeSocket()
		const doc = new Y.Doc()
		doc.getText('t').insert(0, 'hello')

		const pending = YjsHandshakeService.readClientStateVector(buffer, 200)
		socket.receive(awarenessFrame())
		setTimeout(() => socket.receive(syncStep1Frame(doc)), 20)

		expect(await pending).toEqual(stateVector(doc))
	})

	it('returns null when no step 1 arrives in time', async () => {
		const { socket, buffer } = fakeSocket()
		socket.receive(awarenessFrame())

		expect(await YjsHandshakeService.readClientStateVector(buffer, 30)).toBeNull()
	})

	it('leaves every frame in the buffer for replay, in order', async () => {
		const { socket, buffer } = fakeSocket()
		const doc = new Y.Doc()
		const frames = [syncStep1Frame(doc), awarenessFrame(), updateFrame(Y.encodeStateAsUpdate(doc))]
		frames.forEach((frame) => socket.receive(frame))
		await YjsHandshakeService.readClientStateVector(buffer, 50)

		const replayed: Uint8Array[] = []
		socket.on('message', (data: Uint8Array) => replayed.push(new Uint8Array(data)))
		buffer.replay()

		expect(replayed).toEqual(frames)
	})
})

function fakeSocket() {
	const socket = Object.assign(new EventEmitter(), {
		onmessage: null as ((event: { data: unknown }) => void) | null,
		receive(frame: Uint8Array) {
			this.onmessage?.({ data: Buffer.from(frame) })
		},
	})
	return { socket, buffer: new SocketBuffer(socket) }
}
