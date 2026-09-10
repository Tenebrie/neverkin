import { RheaService } from '@src/services/RheaService.js'
import { beforeEach, vi } from 'vitest'

type Access = Awaited<ReturnType<typeof RheaService.getUserAccessLevel>>

const NO_ACCESS: Access = { owner: false, read: false, write: false }

/**
 * Stand-in for Rhea. Users have no access until granted; the document content is empty until set.
 */
export function setupMockRhea() {
	const access = new Map<string, Access>()
	const document = { contentHtml: '' }

	beforeEach(() => {
		access.clear()
		document.contentHtml = ''

		vi.spyOn(RheaService, 'getUserAccessLevel').mockImplementation(
			async ({ userId }) => access.get(userId) ?? NO_ACCESS,
		)
		vi.spyOn(RheaService, 'fetchDocumentState').mockImplementation(async () => ({
			contentHtml: document.contentHtml,
		}))
		vi.spyOn(RheaService, 'flushDocumentState').mockResolvedValue(undefined)
	})

	return {
		grantWrite: (userId: string) => access.set(userId, { owner: false, read: true, write: true }),
		grantRead: (userId: string) => access.set(userId, { owner: false, read: true, write: false }),
		setContent: (contentHtml: string) => {
			document.contentHtml = contentHtml
		},
	}
}
