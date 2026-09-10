import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { WebsocketProvider } from 'y-websocket'
import * as Y from 'yjs'

import { useEventBusSubscribe } from '@/app/features/eventBus'
import { getWorldIdState } from '@/app/views/world/WorldSliceSelectors'

import { createCollaborationExtension, createCollaborationProvider } from './CollaborationExtension'

type UseCollaborationParams = {
	entityType: 'actor' | 'event' | 'article' | 'node'
	documentId: string
	enabled: boolean
}

type DocState = {
	key: string
	doc: Y.Doc | null
	extension: ReturnType<typeof createCollaborationExtension> | null
}

type ConnectionState = {
	doc: Y.Doc
	provider: WebsocketProvider
	key: string
}

export const useCollaboration = ({ entityType, documentId, enabled }: UseCollaborationParams) => {
	const worldId = useSelector(getWorldIdState)
	const [syncedDoc, setSyncedDoc] = useState<Y.Doc | null>(null)
	const connectionRef = useRef<ConnectionState | null>(null)
	const cleanupTimeoutRef = useRef<number | null>(null)
	const [generation, setGeneration] = useState(0)

	const key = enabled ? `${worldId}:${entityType}:${documentId}:${generation}` : ''

	// Create the doc and extension synchronously so the editor mounts with collaboration already attached
	const [docState, setDocState] = useState<DocState>(() => createDocState(key))
	if (docState.key !== key) {
		setDocState(createDocState(key))
	}

	const resetDocument = useCallback(() => {
		if (connectionRef.current) {
			destroyConnection(connectionRef.current)
			connectionRef.current = null
		}
		setGeneration((c) => c + 1)
	}, [])

	useEventBusSubscribe['calliope/documentReset']({
		condition: (data) => data.entityId === documentId,
		callback: resetDocument,
	})

	useEffect(() => {
		const doc = docState.doc
		if (!enabled || !doc) {
			return
		}

		// Cancel pending cleanup from Strict Mode's first unmount
		if (cleanupTimeoutRef.current !== null) {
			clearTimeout(cleanupTimeoutRef.current)
			cleanupTimeoutRef.current = null
		}

		// Reuse existing connection if params haven't changed
		if (connectionRef.current?.key === key) {
			return scheduleCleanup()
		}

		// Tear down old connection if params changed
		if (connectionRef.current) {
			destroyConnection(connectionRef.current)
		}

		const provider = createCollaborationProvider({
			doc,
			worldId,
			entityType,
			documentId,
			onClosed: resetDocument,
		})

		connectionRef.current = { doc, provider, key }
		provider.on('sync', (synced) => {
			if (synced) {
				setSyncedDoc(doc)
			}
		})

		return scheduleCleanup()

		function scheduleCleanup() {
			return () => {
				cleanupTimeoutRef.current = window.setTimeout(() => {
					if (connectionRef.current) {
						destroyConnection(connectionRef.current)
						connectionRef.current = null
					}
				}, 50)
			}
		}
	}, [key, enabled, worldId, entityType, documentId, resetDocument, docState])

	return {
		doc: docState.doc,
		provider: connectionRef.current?.provider ?? null,
		extension: docState.extension,
		hasSynced: !enabled || (docState.doc !== null && syncedDoc === docState.doc),
	}
}

function createDocState(key: string): DocState {
	if (!key) {
		return { key, doc: null, extension: null }
	}
	const doc = new Y.Doc()
	return { key, doc, extension: createCollaborationExtension(doc) }
}

function destroyConnection({ doc, provider }: ConnectionState) {
	console.info('[yjs] Destroying document')
	provider.destroy()
	doc.destroy()
}
