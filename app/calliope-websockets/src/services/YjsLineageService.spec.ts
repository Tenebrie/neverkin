import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'

import { YjsLineageService } from './YjsLineageService.js'
import { htmlToYDoc, yDocToHtml } from './YjsParserService.js'

describe('YjsLineageService - marking', () => {
	it('stamps the build with the server doc client id', () => {
		const server = buildServerDoc('<p>Hello</p>')
		expect(YjsLineageService.readLineageId(server)).toBe(server.clientID)
		expect(stateVector(server).has(server.clientID)).toBe(true)
	})

	it('stamps an empty document too', () => {
		const server = buildServerDoc('')
		expect(stateVector(server).has(server.clientID)).toBe(true)
		expect(yDocToHtml(server)).toBe('')
	})

	it('keeps the marker out of the HTML', () => {
		const server = buildServerDoc('<p>Hello</p>')
		expect(yDocToHtml(server)).toBe('<p>Hello</p>')
	})

	it('survives a round trip through an encoded update, as in Redis', () => {
		const server = buildServerDoc('<p>Hello</p>')
		const reloaded = new Y.Doc()
		Y.applyUpdate(reloaded, Y.encodeStateAsUpdate(server))
		expect(YjsLineageService.readLineageId(reloaded)).toBe(server.clientID)
		expect(reloaded.clientID).not.toBe(server.clientID)
	})
})

describe('YjsLineageService - compatibility', () => {
	it('accepts an empty client', () => {
		expect(YjsLineageService.isCompatibleClientState(123, new Map())).toBe(true)
	})

	it('accepts a client that synced from this build', () => {
		const server = buildServerDoc('<p>Hello</p>')
		const client = syncFrom(server)
		expect(YjsLineageService.isCompatibleClientState(server.clientID, stateVector(client))).toBe(true)
	})

	it('accepts a client that synced and then edited offline', () => {
		const server = buildServerDoc('<p>Hello</p>')
		const client = syncFrom(server)
		typeInto(client, ' world')
		expect(YjsLineageService.isCompatibleClientState(server.clientID, stateVector(client))).toBe(true)
	})

	it('accepts a client that only holds edits relayed from other clients of the same build', () => {
		const server = buildServerDoc('<p>Hello</p>')
		const other = syncFrom(server)
		typeInto(other, ' world')
		Y.applyUpdate(server, Y.encodeStateAsUpdate(other))
		const client = syncFrom(server)
		expect(YjsLineageService.isCompatibleClientState(server.clientID, stateVector(client))).toBe(true)
	})

	it('rejects a client from a previous build of the same content', () => {
		const oldServer = buildServerDoc('<p>Hello</p>')
		const client = syncFrom(oldServer)
		const rebuilt = buildServerDoc('<p>Hello</p>')
		expect(YjsLineageService.isCompatibleClientState(rebuilt.clientID, stateVector(client))).toBe(false)
	})

	it('rejects a non-empty client when the server has no lineage', () => {
		const server = buildServerDoc('<p>Hello</p>')
		const client = syncFrom(server)
		expect(YjsLineageService.isCompatibleClientState(null, stateVector(client))).toBe(false)
	})
})

describe('YjsLineageService - cached state', () => {
	it('applies a complete stamped cache and returns its lineage', () => {
		const server = buildServerDoc('<p>Hello</p>')
		const client = syncFrom(server)
		typeInto(client, ' world')
		const updates = [
			Y.encodeStateAsUpdate(server),
			Y.encodeStateAsUpdate(client, Y.encodeStateVector(server)),
		]

		const target = new Y.Doc()
		expect(YjsLineageService.applyCachedUpdates(target, updates)).toBe(server.clientID)
		expect(yDocToHtml(target)).toBe('<p>Hello world</p>')
	})

	it('leaves the target untouched when the cache is unstamped', () => {
		const unstamped = new Y.Doc()
		htmlToYDoc('<p>Hello</p>', unstamped)

		const target = new Y.Doc()
		expect(YjsLineageService.applyCachedUpdates(target, [Y.encodeStateAsUpdate(unstamped)])).toBeUndefined()
		expect(stateVector(target).size).toBe(0)
	})

	it('leaves the target untouched when an update is missing', () => {
		const server = buildServerDoc('<p>Hello</p>')
		const client = syncFrom(server)
		typeInto(client, ' world')
		const laterOnly = Y.encodeStateAsUpdate(client, Y.encodeStateVector(server))

		const target = new Y.Doc()
		expect(YjsLineageService.applyCachedUpdates(target, [laterOnly])).toBeUndefined()
		expect(stateVector(target).size).toBe(0)
	})

	it('leaves the target untouched when an update is corrupt', () => {
		const server = buildServerDoc('<p>Hello</p>')
		const target = new Y.Doc()
		expect(
			YjsLineageService.applyCachedUpdates(target, [
				Y.encodeStateAsUpdate(server),
				new Uint8Array([7, 7, 7]),
			]),
		).toBeUndefined()
		expect(stateVector(target).size).toBe(0)
	})
})

function buildServerDoc(html: string) {
	const doc = new Y.Doc()
	doc.transact(() => {
		if (html) {
			htmlToYDoc(html, doc)
		}
		YjsLineageService.markLineage(doc)
	})
	return doc
}

function syncFrom(server: Y.Doc) {
	const client = new Y.Doc()
	Y.applyUpdate(client, Y.encodeStateAsUpdate(server))
	return client
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

function stateVector(doc: Y.Doc) {
	return Y.decodeStateVector(Y.encodeStateVector(doc))
}
