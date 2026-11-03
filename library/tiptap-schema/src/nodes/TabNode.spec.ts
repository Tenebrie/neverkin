import { Editor, Extensions } from '@tiptap/core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createTiptapExtensionSchema } from '../createTiptapExtensionSchema.js'

describe('TabNode', () => {
	let editor: Editor

	beforeEach(() => {
		editor = new Editor({
			element: document.createElement('div'),
			extensions: createTiptapExtensionSchema<Extensions>(),
			content: '<p>Hello world</p>',
		})
		editor.commands.focus('end')
	})

	afterEach(() => {
		editor.destroy()
	})

	function press(key: string, options: KeyboardEventInit = {}) {
		editor.view.dom.dispatchEvent(
			new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options }),
		)
	}

	function tabCount() {
		return editor.getHTML().split('data-type="tab"').length - 1
	}

	function indentLevel() {
		const match = editor.getHTML().match(/data-indent="(\d+)"/)
		return match ? Number(match[1]) : 0
	}

	it('inserts a tab character on Tab', () => {
		press('Tab')
		expect(tabCount()).toBe(1)
		expect(indentLevel()).toBe(0)
	})

	it('inserts another tab character when Tab is pressed after a mid-line tab character', () => {
		press('Tab')
		press('Tab')
		expect(tabCount()).toBe(2)
		expect(indentLevel()).toBe(0)
	})

	it('indents the paragraph when Tab is pressed right after a leading tab character', () => {
		editor.commands.focus('start')
		press('Tab')
		press('Tab')
		expect(tabCount()).toBe(1)
		expect(indentLevel()).toBe(1)
		press('Tab')
		expect(indentLevel()).toBe(2)
	})

	it('clamps the paragraph indent at the maximum level', () => {
		editor.commands.focus('start')
		press('Tab')
		for (let i = 0; i < 12; i++) {
			press('Tab')
		}
		expect(indentLevel()).toBe(8)
	})

	it('removes the preceding tab on Shift-Tab', () => {
		press('Tab')
		expect(tabCount()).toBe(1)
		press('Tab', { shiftKey: true })
		expect(tabCount()).toBe(0)
	})

	it('Shift-Tab removes the adjacent tab character before unindenting the paragraph', () => {
		editor.commands.focus('start')
		press('Tab')
		press('Tab')
		expect(tabCount()).toBe(1)
		expect(indentLevel()).toBe(1)
		press('Tab', { shiftKey: true })
		expect(tabCount()).toBe(0)
		expect(indentLevel()).toBe(1)
		press('Tab', { shiftKey: true })
		expect(indentLevel()).toBe(0)
	})

	it('indents selected paragraphs instead of inserting a tab character', () => {
		editor.commands.selectAll()
		press('Tab')
		expect(tabCount()).toBe(0)
		expect(indentLevel()).toBe(1)
		press('Tab', { shiftKey: true })
		expect(indentLevel()).toBe(0)
	})

	it('does not insert a tab on Tab directly after Escape', () => {
		press('Escape')
		press('Tab')
		expect(tabCount()).toBe(0)
	})

	it('escapes only the next Tab: the one after that inserts again', () => {
		press('Escape')
		press('Tab')
		press('Tab')
		expect(tabCount()).toBe(1)
	})

	it('disarms the escape hatch when another key is pressed before Tab', () => {
		press('Escape')
		press('x')
		press('Tab')
		expect(tabCount()).toBe(1)
	})
})
