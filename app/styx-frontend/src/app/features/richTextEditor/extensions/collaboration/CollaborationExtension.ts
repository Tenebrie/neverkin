import Collaboration from '@tiptap/extension-collaboration'
import { WebsocketProvider } from 'y-websocket'
import * as Y from 'yjs'

const DOCUMENT_RESET_CLOSE_CODE = 4001

/**
 * Create Yjs WebSocket provider for real-time collaboration
 */
export function createCollaborationProvider({
	doc,
	worldId,
	entityType,
	documentId,
	onClosed,
}: {
	doc: Y.Doc
	worldId: string
	entityType: string
	documentId: string
	onClosed: () => void
}) {
	const provider = new WebsocketProvider(
		`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/live/yjs/${worldId}/${entityType}`,
		documentId,
		doc,
		{
			disableBc: true,
			maxBackoffTime: 10_000,
			shouldReconnect: (event) =>
				event.code !== DOCUMENT_RESET_CLOSE_CODE && !(event.code >= 4400 && event.code < 4500),
		},
	)

	provider.on('status', (event) => {
		console.info(`[yjs] Connection ${event.status}`)
	})
	provider.on('closed', (event) => {
		console.info(`[yjs] Server closed the connection permanently (${event.code} ${event.reason})`)
		onClosed()
	})

	console.info(`[yjs] Attempting connection to ${provider.url}...`)
	return provider
}

/**
 * Create Tiptap Collaboration extension with Yjs document
 */
export const createCollaborationExtension = (doc: Y.Doc) => {
	return Collaboration.configure({
		document: doc,
	})
}
