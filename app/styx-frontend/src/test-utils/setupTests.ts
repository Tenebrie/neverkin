import { configure } from '@testing-library/dom'
import { fetch, Headers, Request, Response } from 'undici'

// Force jsdom to use undici's fetch (which MSW can intercept)
// @ts-expect-error 123
globalThis.fetch = fetch
// @ts-expect-error 123
globalThis.Headers = Headers
// @ts-expect-error 123
globalThis.Request = Request
// @ts-expect-error 123
globalThis.Response = Response

import '@testing-library/jest-dom'

import { beforeAll, rstest } from '@rstest/core'

console.debug = () => {}

rstest.mock('./app/features/liveUpdates/useLiveUpdates', () => ({
	useLiveUpdates: () => {
		/* Empty */
	},
}))

configure({
	getElementError: (message) => {
		const error = new Error(message ?? '')
		error.name = 'TestingLibraryElementError'
		error.stack = undefined
		return error
	},
})

beforeAll(() => {
	global.ResizeObserver = class ResizeObserver {
		observe() {
			// do nothing
		}
		unobserve() {
			// do nothing
		}
		disconnect() {
			// do nothing
		}
	}

	global.requestIdleCallback = (callback: IdleRequestCallback, _?: IdleRequestOptions) => {
		const start = Date.now()
		return setTimeout(() => {
			callback({
				didTimeout: false,
				timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
			})
		}, 1) as unknown as number
	}
	global.requestAnimationFrame = (callback: FrameRequestCallback) => {
		return setTimeout(callback, 1) as unknown as number
	}
})
window.scrollTo = rstest.fn()
Object.defineProperty(HTMLElement.prototype, 'isContentEditable', {
	get(this: HTMLElement) {
		return this.closest('[contenteditable]:not([contenteditable="false"])') !== null
	},
})
