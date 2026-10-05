import { afterEach, beforeEach, describe, expect, it, rstest } from '@rstest/core'
import { renderHook } from '@testing-library/react'

import { useClipboard } from './useClipboard'

describe('useClipboard', () => {
	const containerRef = { current: document.createElement('div') }
	const onCopy = rstest.fn()
	const onPaste = rstest.fn()
	const onCut = rstest.fn((event: ClipboardEvent, copy: (event: ClipboardEvent) => unknown) => copy(event))

	beforeEach(() => {
		const container = document.createElement('div')
		container.tabIndex = -1
		document.body.append(container)
		containerRef.current = container
	})

	afterEach(() => {
		document.body.replaceChildren()
	})

	it('calls onCopy when focus is inside the container', () => {
		containerRef.current.focus()
		renderHook(() => useClipboard({ containerRef, onCopy }))
		const event = new Event('copy', { bubbles: true })

		containerRef.current.dispatchEvent(event)

		expect(onCopy).toHaveBeenCalledExactlyOnceWith(event)
	})

	it('calls onPaste when focus is inside the container', () => {
		containerRef.current.focus()
		renderHook(() => useClipboard({ containerRef, onPaste }))
		const event = new Event('paste', { bubbles: true })

		containerRef.current.dispatchEvent(event)

		expect(onPaste).toHaveBeenCalledExactlyOnceWith(event)
	})

	it('calls onCut with a copy function that runs onCopy', () => {
		containerRef.current.focus()
		renderHook(() => useClipboard({ containerRef, onCopy, onCut }))
		const event = new Event('cut', { bubbles: true })

		containerRef.current.dispatchEvent(event)

		expect(onCut).toHaveBeenCalledOnce()
		expect(onCopy).toHaveBeenCalledExactlyOnceWith(event)
	})

	it('ignores events when focus is outside the container', () => {
		const outside = document.createElement('div')
		outside.tabIndex = -1
		document.body.append(outside)
		outside.focus()
		renderHook(() => useClipboard({ containerRef, onCopy }))

		outside.dispatchEvent(new Event('copy', { bubbles: true }))

		expect(onCopy).not.toHaveBeenCalled()
	})

	it('ignores events from an input inside the container', () => {
		const input = document.createElement('input')
		containerRef.current.append(input)
		input.focus()
		renderHook(() => useClipboard({ containerRef, onCopy }))

		input.dispatchEvent(new Event('copy', { bubbles: true }))

		expect(onCopy).not.toHaveBeenCalled()
	})

	it('ignores events from a textarea inside the container', () => {
		const textarea = document.createElement('textarea')
		containerRef.current.append(textarea)
		textarea.focus()
		renderHook(() => useClipboard({ containerRef, onPaste }))

		textarea.dispatchEvent(new Event('paste', { bubbles: true }))

		expect(onPaste).not.toHaveBeenCalled()
	})

	it('ignores events from a contentEditable element inside the container', () => {
		const editor = document.createElement('div')
		editor.setAttribute('contenteditable', 'true')
		editor.tabIndex = -1
		containerRef.current.append(editor)
		editor.focus()
		renderHook(() => useClipboard({ containerRef, onCut }))

		editor.dispatchEvent(new Event('cut', { bubbles: true }))

		expect(onCut).not.toHaveBeenCalled()
	})

	it('focuses the container on pointerdown', () => {
		renderHook(() => useClipboard({ containerRef }))

		containerRef.current.dispatchEvent(new Event('pointerdown'))

		expect(document.activeElement).toBe(containerRef.current)
	})

	it('stops handling events after unmount', () => {
		containerRef.current.focus()
		const { unmount } = renderHook(() => useClipboard({ containerRef, onCopy }))
		unmount()

		containerRef.current.dispatchEvent(new Event('copy', { bubbles: true }))

		expect(onCopy).not.toHaveBeenCalled()
	})
})
