import { persistenceLeaderService } from '@src/services/PersistenceLeaderService.js'
import { RedisService } from '@src/services/RedisService.js'
import { beforeEach, vi } from 'vitest'

/**
 * In-memory stand-in for the Yjs document cache and the persistence leader lock.
 * `documents` maps a doc name to its update log, exactly as Redis would hold it.
 */
export function setupMockRedis() {
	const documents = new Map<string, Uint8Array[]>()

	beforeEach(() => {
		documents.clear()

		vi.spyOn(RedisService, 'getDocumentUpdates').mockImplementation(async (docName) => [
			...(documents.get(docName) ?? []),
		])
		vi.spyOn(RedisService, 'createDocumentState').mockImplementation(async (docName, state) => {
			documents.set(docName, [state])
		})
		vi.spyOn(RedisService, 'appendDocumentUpdate').mockImplementation(async (docName, update) => {
			const updates = documents.get(docName)
			updates?.push(update)
			return updates !== undefined
		})
		vi.spyOn(RedisService, 'deleteDocumentUpdates').mockImplementation(async (docName) => {
			documents.delete(docName)
		})
		vi.spyOn(RedisService, 'tryAcquireDocLock').mockResolvedValue(true)
		vi.spyOn(RedisService, 'releaseDocLock').mockResolvedValue(undefined)
		vi.spyOn(RedisService, 'refreshDocumentTTL').mockResolvedValue(undefined)
		vi.spyOn(RedisService, 'broadcastYjsUpdate').mockReturnValue(undefined)

		vi.spyOn(persistenceLeaderService, 'tryAcquireLeadership').mockResolvedValue(true)
		vi.spyOn(persistenceLeaderService, 'release').mockResolvedValue(undefined)
	})

	return { documents }
}
