import { Editor } from '@tiptap/core'
import { SuggestionOptions } from '@tiptap/suggestion'

import { dispatchGlobalEvent } from '@/app/features/eventBus'

export const mentionsSuggestions: Omit<SuggestionOptions, 'editor'> = {
	allowSpaces: true,
	allow: ({ state, range }) => {
		const $from = state.doc.resolve(range.from)
		const isInCodeMark = $from.nodeAfter?.marks.some((mark) => mark.type.spec.code)
		return !$from.parent.type.spec.code && !isInCodeMark
	},
	render: () => {
		const state = {
			isOpen: false,
			editor: null as Editor | null,
		}

		return {
			onStart: (props) => {
				state.isOpen = true
				state.editor = props.editor
				const pos = props.editor.view.coordsAtPos(props.range.from)
				dispatchGlobalEvent['quickSelect/requestOpen']({
					query: props.query,
					screenPosTop: pos.top,
					screenPosBottom: pos.bottom,
					screenPosLeft: pos.left,
				})
			},

			onUpdate(props) {
				const pos = props.editor.view.coordsAtPos(props.range.from)
				dispatchGlobalEvent['quickSelect/requestUpdate']({
					query: props.query,
					screenPosTop: pos.top,
					screenPosBottom: pos.bottom,
					screenPosLeft: pos.left,
				})
			},

			onKeyDown({ event }) {
				if (!state.isOpen || !state.editor) {
					return false
				}
				if (event.key === 'Escape') {
					state.isOpen = false
					return true
				}
				if (event.key === 'Enter' && event.shiftKey) {
					return false
				}
				if (['ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'PageUp', 'PageDown'].includes(event.key)) {
					dispatchGlobalEvent['quickSelect/onKeyDown']({
						key: event.key,
						shiftKey: event.shiftKey,
					})
					return true
				}
				return false
			},

			onExit() {
				state.isOpen = false
				dispatchGlobalEvent['quickSelect/requestClose']()
			},
		}
	},
}
