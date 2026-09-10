import { closedWith, setupSocketPairs, SocketPair } from '@src/test-utils/openSocketPair.js'
import { setupMockRedis } from '@src/test-utils/setupMockRedis.js'
import { setupMockRhea } from '@src/test-utils/setupMockRhea.js'
import { randomDocument, syncOverSocket, syncStep1Frame, TestDocument } from '@src/test-utils/yjs.js'
import { docs } from '@y/websocket-server/utils'
import { beforeEach, describe, expect, it } from 'vitest'
import * as Y from 'yjs'

import { YjsConnectionService } from './YjsConnectionService.js'
import { htmlToYDoc, yDocToHtml } from './YjsParserService.js'

setupMockRedis()
const rhea = setupMockRhea()
const openSocketPair = setupSocketPairs()

beforeEach(() => {
	rhea.grantWrite('writer')
	rhea.setContent('<p>Hello</p>')
})

describe('YjsConnectionService - connect', () => {
	it('syncs an empty client to the document', async () => {
		const document = randomDocument()
		const pair = await openSocketPair()
		const client = new Y.Doc()

		await Promise.all([connect(pair, document), syncOverSocket(pair.client, client)])

		expect(yDocToHtml(client)).toBe('<p>Hello</p>')
	})

	it('reattaches a client that synced from the same build', async () => {
		const document = randomDocument()
		const first = await openSocketPair()
		const client = new Y.Doc()
		await Promise.all([connect(first, document), syncOverSocket(first.client, client)])
		await first.close()

		const second = await openSocketPair()
		await Promise.all([connect(second, document), syncOverSocket(second.client, client)])

		expect(second.client.readyState).toBe(second.client.OPEN)
	})

	it('declines a client from another build and releases the document', async () => {
		const document = randomDocument()
		const pair = await openSocketPair()
		const stale = new Y.Doc()
		htmlToYDoc('<p>Hello</p>', stale)
		const closed = closedWith(pair.client)

		const connecting = connect(pair, document)
		pair.client.send(syncStep1Frame(stale))
		await connecting

		expect(await closed).toEqual({ code: 4409, reason: 'Document lineage changed' })
		expect(docs.has(document.docName)).toBe(false)
	})

	it('releases the document when the handshake throws', async () => {
		const document = randomDocument()
		const pair = await openSocketPair()

		const connecting = connect(pair, document)
		pair.client.send(new Uint8Array([0, 0, 200, 1, 1, 1]))
		await expect(connecting).rejects.toThrow()

		expect(docs.has(document.docName)).toBe(false)
	})
})

function connect(pair: SocketPair, { worldId, entityId, entityType }: TestDocument) {
	return YjsConnectionService.connect({
		socket: pair.server,
		req: pair.req,
		userId: 'writer',
		worldId,
		entityType,
		documentId: entityId,
	})
}
