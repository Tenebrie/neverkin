import CharacterCount from '@tiptap/extension-character-count'
import Color from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import { HardBreak } from '@tiptap/extension-hard-break'
import ImageExtension from '@tiptap/extension-image'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import { TextStyle } from '@tiptap/extension-text-style'
import StarterKit from '@tiptap/starter-kit'

import { IndentExtension } from './extensions/IndentExtension.js'
import { ExternalImageNode } from './nodes/ExternalImageNode.js'
import { MentionNode } from './nodes/MentionNode.js'
import { TabNode } from './nodes/TabNode.js'

export const BaseExtensions = {
	StarterKit: StarterKit.configure({
		hardBreak: false,
		undoRedo: false,
		link: { openOnClick: false },
	}),
	CharacterCount: CharacterCount.configure({
		limit: 1000000,
	}),

	// Support for hard breaks (Shift + Enter)
	HardBreak: HardBreak.extend({
		addKeyboardShortcuts() {
			return {
				...this?.parent?.(),
				'Mod-Enter': () => false,
			}
		},
	}),

	// Support for entity mentions
	MentionNode,

	// Image embeds
	ImageExtension,
	ExternalImageNode,

	// Text formatting
	TextStyle,
	Color,
	FontFamily,

	// Tab characters and block indentation (Tab / Shift+Tab)
	TabNode,
	IndentExtension,

	// Tables
	Table: Table.configure({ resizable: false }),
	TableRow,
	TableCell,
	TableHeader,
} as const

export function createTiptapExtensionSchema<T>(
	overrides: Partial<Record<keyof typeof BaseExtensions, unknown>> = {},
): T {
	const merged = {
		...BaseExtensions,
		...overrides,
	}
	return Object.values(merged) as T
}
