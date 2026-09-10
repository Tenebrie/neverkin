import { setupSocketPairs } from '@src/test-utils/openSocketPair.js'
import { setupMockRedis } from '@src/test-utils/setupMockRedis.js'
import { setupMockRhea } from '@src/test-utils/setupMockRhea.js'
import { liveDocument, randomDocument, syncFrom, typeInto, updateFrame } from '@src/test-utils/yjs.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as Y from 'yjs'

import { RedisService } from './RedisService.js'
import { RheaService } from './RheaService.js'
import { YjsLineageService } from './YjsLineageService.js'
import { htmlToYDoc, yDocToHtml } from './YjsParserService.js'
import { YjsSyncService } from './YjsSyncService.js'

const redis = setupMockRedis()
const rhea = setupMockRhea()
const openSocketPair = setupSocketPairs()

beforeEach(() => {
	rhea.grantWrite('writer')
	rhea.setContent('<p>Hello</p>')
})

describe('YjsSyncService - update persistence', () => {
	it('persists client edits when the only connection was accepted', async () => {
		const document = randomDocument()
		const connection = await YjsSyncService.setupDocumentListener({ userId: 'writer', ...document })
		const pair = await openSocketPair()
		expect(connection.attach(pair.server, pair.req)).toBe(true)

		pair.client.send(clientEditFrame(document.docName, ' world'))

		await vi.waitFor(() =>
			expect(RedisService.appendDocumentUpdate).toHaveBeenCalledWith(document.docName, expect.anything()),
		)
	})

	it('persists client edits when the first connection was denied while a second was pending', async () => {
		const document = randomDocument()
		const denied = YjsSyncService.setupDocumentListener({ userId: 'stranger', ...document })
		const accepted = YjsSyncService.setupDocumentListener({ userId: 'writer', ...document })
		await expect(denied).rejects.toThrow()
		const connection = await accepted
		const pair = await openSocketPair()
		expect(connection.attach(pair.server, pair.req)).toBe(true)

		pair.client.send(clientEditFrame(document.docName, ' world'))

		await vi.waitFor(() =>
			expect(RedisService.appendDocumentUpdate).toHaveBeenCalledWith(document.docName, expect.anything()),
		)
	})
})

describe('YjsSyncService - rebuilding from the database', () => {
	it('seeds Redis with a loadable state when a foreign update arrives mid-rebuild', async () => {
		const document = randomDocument()
		const foreign = new Y.Doc()
		htmlToYDoc('<p>Old build</p>', foreign)
		redis.documents.set(document.docName, [Y.encodeStateAsUpdate(foreign)])
		const foreignBase = Y.encodeStateVector(foreign)
		typeInto(foreign, ' edited elsewhere')
		vi.mocked(RheaService.fetchDocumentState).mockImplementationOnce(async () => {
			YjsSyncService.handleRemoteUpdate(document.docName, Y.encodeStateAsUpdate(foreign, foreignBase))
			return { contentHtml: '<p>Hello</p>' }
		})

		const connection = await YjsSyncService.setupDocumentListener({ userId: 'writer', ...document })
		await connection.abandon()

		const nextInstance = new Y.Doc()
		const seeded = redis.documents.get(document.docName) ?? []
		expect(YjsLineageService.applyCachedUpdates(nextInstance, seeded)).toBe(connection.lineageId)
		expect(yDocToHtml(nextInstance)).toBe('<p>Hello</p>')
	})
})

function clientEditFrame(docName: string, text: string) {
	const client = syncFrom(liveDocument(docName))
	const before = Y.encodeStateVector(client)
	typeInto(client, text)
	return updateFrame(Y.encodeStateAsUpdate(client, before))
}
