import * as Y from 'yjs'

const LINEAGE_MAP = 'meta'
const LINEAGE_KEY = 'lineage'

export const YjsLineageService = {
	/**
	 * Stamp a freshly built server doc with its own client id, so every client that ever
	 * syncs from this build carries the id in its state vector.
	 */
	markLineage: (doc: Y.Doc): number => {
		doc.getMap<number>(LINEAGE_MAP).set(LINEAGE_KEY, doc.clientID)
		return doc.clientID
	},

	readLineageId: (doc: Y.Doc): number | undefined => {
		return doc.getMap<number>(LINEAGE_MAP).get(LINEAGE_KEY)
	},

	/**
	 * A client doc is compatible if it is empty or descends from the server's build of the document.
	 */
	isCompatibleClientState: (lineageId: number | null, clientStateVector: Map<number, number>) => {
		if (clientStateVector.size === 0) {
			return true
		}
		return lineageId !== null && clientStateVector.has(lineageId)
	},

	/**
	 * Apply cached updates to the doc only if they form a complete, lineage-stamped state.
	 * Returns the lineage id on success; the target doc is untouched on failure.
	 */
	applyCachedUpdates: (doc: Y.Doc, updates: Uint8Array[], origin?: unknown): number | undefined => {
		const cached = new Y.Doc()
		try {
			for (const update of updates) {
				Y.applyUpdate(cached, update)
			}
			const isComplete = cached.store.pendingStructs === null && cached.store.pendingDs === null
			const lineageId = YjsLineageService.readLineageId(cached)
			if (!isComplete || lineageId === undefined) {
				return undefined
			}
			Y.applyUpdate(doc, Y.encodeStateAsUpdate(cached), origin)
			return lineageId
		} catch {
			return undefined
		} finally {
			cached.destroy()
		}
	},
}
