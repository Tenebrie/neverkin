import { docs } from '@y/websocket-server/utils'
import { randomUUID } from 'crypto'
import * as decoding from 'lib0/decoding'
import * as encoding from 'lib0/encoding'
import { RawData, WebSocket } from 'ws'
import * as syncProtocol from 'y-protocols/sync'
import * as Y from 'yjs'

const MESSAGE_SYNC = 0
const MESSAGE_AWARENESS = 1

export type TestDocument = {
	worldId: string
	entityId: string
	entityType: 'article'
	docName: string
}

export function randomDocument(): TestDocument {
	const worldId = randomUUID()
	const entityId = randomUUID()
	return { worldId, entityId, entityType: 'article', docName: `${worldId}:${entityId}` }
}

/**
 * The server-side doc y-websocket-server currently holds for `docName`.
 */
export function liveDocument(docName: string) {
	const doc = docs.get(docName)
	if (!doc) {
		throw new Error(`Document ${docName} is not live`)
	}
	return doc
}

export function stateVector(doc: Y.Doc) {
	return Y.decodeStateVector(Y.encodeStateVector(doc))
}

export function syncFrom(server: Y.Doc) {
	const client = new Y.Doc()
	Y.applyUpdate(client, Y.encodeStateAsUpdate(server))
	return client
}

/**
 * Append text to the first paragraph of the default fragment, creating it if needed.
 */
export function typeInto(doc: Y.Doc, text: string) {
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

export function syncStep1Frame(doc: Y.Doc) {
	const encoder = encoding.createEncoder()
	encoding.writeVarUint(encoder, MESSAGE_SYNC)
	syncProtocol.writeSyncStep1(encoder, doc)
	return encoding.toUint8Array(encoder)
}

export function updateFrame(update: Uint8Array) {
	const encoder = encoding.createEncoder()
	encoding.writeVarUint(encoder, MESSAGE_SYNC)
	syncProtocol.writeUpdate(encoder, update)
	return encoding.toUint8Array(encoder)
}

export function awarenessFrame() {
	const encoder = encoding.createEncoder()
	encoding.writeVarUint(encoder, MESSAGE_AWARENESS)
	encoding.writeVarUint8Array(encoder, new Uint8Array([0]))
	return encoding.toUint8Array(encoder)
}

/**
 * Run the y-websocket client side of the sync protocol over a socket.
 * Resolves once the server's sync step 2 has been applied to `doc`.
 */
export function syncOverSocket(socket: WebSocket, doc: Y.Doc): Promise<void> {
	return new Promise((resolve) => {
		socket.on('message', (data) => {
			const decoder = decoding.createDecoder(toBytes(data))
			if (decoding.readVarUint(decoder) !== MESSAGE_SYNC) {
				return
			}
			const encoder = encoding.createEncoder()
			encoding.writeVarUint(encoder, MESSAGE_SYNC)
			const messageType = syncProtocol.readSyncMessage(decoder, encoder, doc, socket)
			if (encoding.length(encoder) > 1) {
				socket.send(encoding.toUint8Array(encoder))
			}
			if (messageType === syncProtocol.messageYjsSyncStep2) {
				resolve()
			}
		})
		socket.send(syncStep1Frame(doc))
	})
}

function toBytes(data: RawData): Uint8Array {
	if (Array.isArray(data)) {
		return Buffer.concat(data)
	}
	return new Uint8Array(data)
}
