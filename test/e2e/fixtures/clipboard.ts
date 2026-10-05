import { BrowserContext } from '@playwright/test'

type ClipboardEntries = [type: string, value: string][]

declare global {
	interface Window {
		__writeMockClipboard: (entries: ClipboardEntries) => Promise<void>
		__readMockClipboard: () => Promise<ClipboardEntries>
	}
}

export async function installClipboardMock(context: BrowserContext) {
	let clipboard: ClipboardEntries = []

	await context.exposeBinding('__writeMockClipboard', (_, entries: ClipboardEntries) => {
		clipboard = entries
	})
	await context.exposeBinding('__readMockClipboard', () => clipboard)

	await context.addInitScript(() => {
		const storeWrittenData = (event: ClipboardEvent) => {
			const data = event.clipboardData
			if (!data || data.types.length === 0) {
				return
			}
			window.__writeMockClipboard(data.types.map((type) => [type, data.getData(type)]))
		}
		window.addEventListener('copy', storeWrittenData)
		window.addEventListener('cut', storeWrittenData)

		window.addEventListener(
			'paste',
			async (event) => {
				if (!event.isTrusted) {
					return
				}
				event.stopImmediatePropagation()
				event.preventDefault()

				const transfer = new DataTransfer()
				for (const [type, value] of await window.__readMockClipboard()) {
					transfer.setData(type, value)
				}
				const mockPaste = new ClipboardEvent('paste', { bubbles: true, cancelable: true })
				Object.defineProperty(mockPaste, 'clipboardData', { value: transfer })
				event.target?.dispatchEvent(mockPaste)
			},
			true,
		)
	})
}
