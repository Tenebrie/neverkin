import { Node } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

type TabNodeStorage = {
	passNextTab: boolean
}

// A tab character as an inline atom.
export const TabNode = Node.create<object, TabNodeStorage>({
	name: 'tabNode',
	inline: true,
	group: 'inline',
	atom: true,

	parseHTML() {
		return [{ tag: 'span[data-type="tab"]' }]
	},

	renderHTML() {
		return ['span', { 'data-type': 'tab' }]
	},

	addStorage() {
		return {
			passNextTab: false,
		}
	},

	addProseMirrorPlugins() {
		const { storage } = this
		return [
			new Plugin({
				key: new PluginKey('tabEscapeHatch'),
				props: {
					handleKeyDown: (_, event) => {
						if (event.key === 'Escape') {
							storage.passNextTab = true
						} else if (event.key !== 'Tab') {
							storage.passNextTab = false
						}
						return false
					},
					handleDOMEvents: {
						mousedown: () => {
							storage.passNextTab = false
							return false
						},
					},
				},
			}),
		]
	},

	// Google Docs semantics: a tab character and block indent coexist, and caret
	// adjacency to a tab character decides which one Tab/Shift-Tab operates on.
	addKeyboardShortcuts() {
		return {
			Tab: () => {
				if (this.storage.passNextTab) {
					this.storage.passNextTab = false
					return false
				}
				if (this.editor.isActive('codeBlock')) {
					return this.editor.commands.insertContent('\t')
				}
				if (this.editor.isActive('listItem')) {
					this.editor.commands.sinkListItem('listItem')
					// Consume Tab even when the item cannot sink so focus stays in the editor
					return true
				}
				if (this.editor.isActive('table')) {
					return false
				}
				const { $from, empty } = this.editor.state.selection
				if (empty && $from.nodeBefore?.type.name !== this.name) {
					return this.editor.commands.insertContent({ type: this.name })
				}
				// Caret directly after a tab character, or a selection: indent the block(s)
				this.editor.commands.indent()
				// Consume Tab even at max indent so focus stays in the editor
				return true
			},
			'Shift-Tab': () => {
				if (this.storage.passNextTab) {
					this.storage.passNextTab = false
					return false
				}
				if (this.editor.isActive('listItem')) {
					return this.editor.commands.liftListItem('listItem')
				}
				if (this.editor.isActive('table')) {
					return false
				}
				const { $from, empty } = this.editor.state.selection
				const before = $from.nodeBefore
				if (empty && before?.type.name === this.name) {
					return this.editor.commands.deleteRange({ from: $from.pos - before.nodeSize, to: $from.pos })
				}
				return this.editor.commands.outdent()
			},
		}
	},
})
