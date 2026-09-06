import { openSocketPair, SocketPair } from '@src/utils/testing/openSocketPair.js'
import { docs } from '@y/websocket-server/utils'
import * as encoding from 'lib0/encoding'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as syncProtocol from 'y-protocols/sync'
import * as Y from 'yjs'

import { YjsLineageService } from './YjsLineageService.js'
import { htmlToYDoc, yDocToHtml } from './YjsParserService.js'
import { YjsSyncService } from './YjsSyncService.js'

const redisStore = new Map<string, Uint8Array[]>()
const access = new Map<string, 'read' | 'write'>()
const rheaHtml = { value: '<p>Hello</p>' }
const onFetchDocumentState = { hook: async () => {} }

vi.mock('./RedisService.js', () => ({
	RedisService: {
		getDocumentUpdates: vi.fn(async (docName: string) => [...(redisStore.get(docName) ?? [])]),
		createDocumentState: vi.fn(async (docName: string, state: Uint8Array) => {
			redisStore.set(docName, [state])
		}),
		appendDocumentUpdate: vi.fn(async (docName: string, update: Uint8Array) => {
			const list = redisStore.get(docName)
			if (!list) {
				return false
			}
			list.push(update)
			return true
		}),
		deleteDocumentUpdates: vi.fn(async (docName: string) => {
			redisStore.delete(docName)
		}),
		tryAcquireDocLock: vi.fn(async () => true),
		releaseDocLock: vi.fn(async () => {}),
		refreshDocumentTTL: vi.fn(async () => {}),
		broadcastYjsUpdate: vi.fn(),
	},
}))

vi.mock('./RheaService.js', () => ({
	RheaService: {
		getUserAccessLevel: vi.fn(async ({ userId }: { userId: string }) => {
			const level = access.get(userId)
			if (!level) {
				throw new Error('User does not have required access level')
			}
			return { read: true, write: level === 'write' }
		}),
		fetchDocumentState: vi.fn(async () => {
			await onFetchDocumentState.hook()
			return { contentHtml: rheaHtml.value }
		}),
		flushDocumentState: vi.fn(async () => {}),
	},
}))

vi.mock('./PersistenceLeaderService.js', () => ({
	persistenceLeaderService: {
		tryAcquireLeadership: vi.fn(async () => true),
		release: vi.fn(async () => {}),
	},
}))

const { RedisService } = await import('./RedisService.js')

let docCounter = 0
const openPairs: SocketPair[] = []

beforeEach(() => {
	redisStore.clear()
	access.clear()
	access.set('writer', 'write')
	rheaHtml.value = '<p>Hello</p>'
	onFetchDocumentState.hook = async () => {}
	vi.clearAllMocks()
})

afterEach(async () => {
	await Promise.all(openPairs.splice(0).map((pair) => pair.close()))
})

describe('YjsSyncService - update persistence', () => {
	it('persists client edits when the only connection was accepted', async () => {
		const params = documentParams()
		const connection = await YjsSyncService.setupDocumentListener({ userId: 'writer', ...params })
		const pair = await attach(connection)

		pair.client.send(clientEditFrame(docs.get(params.docName)!, ' world'))

		await vi.waitFor(() =>
			expect(RedisService.appendDocumentUpdate).toHaveBeenCalledWith(params.docName, expect.anything()),
		)
	})

	it('persists client edits when the first connection was denied while a second was pending', async () => {
		const params = documentParams()
		const denied = YjsSyncService.setupDocumentListener({ userId: 'stranger', ...params })
		const accepted = YjsSyncService.setupDocumentListener({ userId: 'writer', ...params })
		await expect(denied).rejects.toThrow()
		const pair = await attach(await accepted)

		pair.client.send(clientEditFrame(docs.get(params.docName)!, ' world'))

		await vi.waitFor(() =>
			expect(RedisService.appendDocumentUpdate).toHaveBeenCalledWith(params.docName, expect.anything()),
		)
	})
})

describe('YjsSyncService - rebuilding from the database', () => {
	it('seeds Redis with a loadable state when a foreign update arrives mid-rebuild', async () => {
		const params = documentParams()
		const foreign = new Y.Doc()
		htmlToYDoc('<p>Old build</p>', foreign)
		redisStore.set(params.docName, [Y.encodeStateAsUpdate(foreign)])

		const foreignBase = Y.encodeStateVector(foreign)
		typeInto(foreign, ' edited elsewhere')
		const foreignUpdate = Y.encodeStateAsUpdate(foreign, foreignBase)
		onFetchDocumentState.hook = async () => {
			YjsSyncService.handleRemoteUpdate(params.docName, foreignUpdate)
		}

		const connection = await YjsSyncService.setupDocumentListener({ userId: 'writer', ...params })
		await connection.abandon()

		expect(RedisService.createDocumentState).toHaveBeenCalledTimes(1)
		const seeded = redisStore.get(params.docName)!
		const nextInstance = new Y.Doc()
		expect(YjsLineageService.applyCachedUpdates(nextInstance, seeded)).toBe(connection.lineageId)
		expect(yDocToHtml(nextInstance)).toBe('<p>Hello</p>')
	})
})

function documentParams() {
	const documentId = `doc-${++docCounter}`
	return {
		worldId: 'world-1',
		entityId: documentId,
		entityType: 'article' as const,
		docName: `world-1:${documentId}`,
	}
}

async function attach(connection: Awaited<ReturnType<typeof YjsSyncService.setupDocumentListener>>) {
	const pair = await openSocketPair()
	openPairs.push(pair)
	expect(connection.attach(pair.server, pair.req)).toBe(true)
	return pair
}

function clientEditFrame(serverDoc: Y.Doc, text: string) {
	const clientDoc = new Y.Doc()
	Y.applyUpdate(clientDoc, Y.encodeStateAsUpdate(serverDoc))
	const before = Y.encodeStateVector(clientDoc)
	typeInto(clientDoc, text)
	const encoder = encoding.createEncoder()
	encoding.writeVarUint(encoder, 0)
	syncProtocol.writeUpdate(encoder, Y.encodeStateAsUpdate(clientDoc, before))
	return encoding.toUint8Array(encoder)
}

function typeInto(doc: Y.Doc, text: string) {
	const fragment = doc.getXmlFragment('default')
	const paragraph = fragment.get(0)
	if (paragraph instanceof Y.XmlElement) {
		const textNode = paragraph.get(0)
		if (textNode instanceof Y.XmlText) {
			textNode.insert(textNode.length, text)
			return
		}
		paragraph.insert(0, [new Y.XmlText(text)])
		return
	}
	const newParagraph = new Y.XmlElement('paragraph')
	newParagraph.insert(0, [new Y.XmlText(text)])
	fragment.insert(0, [newParagraph])
}
