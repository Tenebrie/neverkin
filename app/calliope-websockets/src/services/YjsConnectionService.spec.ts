import { closedWith, openSocketPair, SocketPair } from '@src/utils/testing/openSocketPair.js'
import * as encoding from 'lib0/encoding'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as syncProtocol from 'y-protocols/sync'
import * as Y from 'yjs'

import { YjsConnectionService } from './YjsConnectionService.js'
import { recordLastWritingUser, YjsSyncService } from './YjsSyncService.js'

vi.mock('./YjsSyncService.js', () => ({
	YjsSyncService: { setupDocumentListener: vi.fn() },
	recordLastWritingUser: vi.fn(),
}))

const SERVER_LINEAGE = 42
let pair: SocketPair
let connection: ReturnType<typeof pendingConnection>

beforeEach(async () => {
	pair = await openSocketPair()
	connection = pendingConnection()
	vi.mocked(YjsSyncService.setupDocumentListener).mockResolvedValue(connection)
})

afterEach(async () => {
	await pair.close()
	vi.clearAllMocks()
})

describe('YjsConnectionService - connect', () => {
	it('attaches a client of the same lineage and replays its frames', async () => {
		pair.client.send(syncStep1Frame(clientDocOfLineage(SERVER_LINEAGE)))

		await connect()

		expect(connection.attach).toHaveBeenCalledWith(pair.server, pair.req)
		expect(connection.abandon).not.toHaveBeenCalled()
		expect(recordLastWritingUser).toHaveBeenCalledWith('world-1:doc-1', 'user-1')
	})

	it('attaches an empty client', async () => {
		pair.client.send(syncStep1Frame(new Y.Doc()))

		await connect()

		expect(connection.attach).toHaveBeenCalledOnce()
	})

	it('declines a client of another lineage and abandons the document', async () => {
		const closed = closedWith(pair.client)
		pair.client.send(syncStep1Frame(clientDocOfLineage(7)))

		await connect()

		expect(await closed).toEqual({ code: 4409, reason: 'Document lineage changed' })
		expect(connection.attach).not.toHaveBeenCalled()
		expect(connection.abandon).toHaveBeenCalledOnce()
	})

	it('abandons the document when the handshake throws', async () => {
		pair.client.send(new Uint8Array([0, 0, 200, 1, 1, 1]))

		await expect(connect()).rejects.toThrow()

		expect(connection.attach).not.toHaveBeenCalled()
		expect(connection.abandon).toHaveBeenCalledOnce()
	})
})

function connect() {
	return YjsConnectionService.connect({
		socket: pair.server,
		req: pair.req,
		userId: 'user-1',
		worldId: 'world-1',
		entityType: 'article',
		documentId: 'doc-1',
	})
}

function pendingConnection() {
	return {
		accessLevel: 'write' as const,
		lineageId: SERVER_LINEAGE,
		attach: vi.fn(() => true),
		abandon: vi.fn(async () => {}),
	}
}

function clientDocOfLineage(lineageId: number) {
	const server = new Y.Doc()
	server.clientID = lineageId
	server.getMap<number>('meta').set('lineage', lineageId)
	const client = new Y.Doc()
	Y.applyUpdate(client, Y.encodeStateAsUpdate(server))
	return client
}

function syncStep1Frame(doc: Y.Doc) {
	const encoder = encoding.createEncoder()
	encoding.writeVarUint(encoder, 0)
	syncProtocol.writeSyncStep1(encoder, doc)
	return encoding.toUint8Array(encoder)
}
