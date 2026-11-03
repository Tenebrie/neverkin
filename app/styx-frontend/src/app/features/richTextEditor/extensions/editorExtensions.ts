import '@tiptap/starter-kit'
import '@tiptap/extension-character-count'
import '@tiptap/extension-collaboration'
import '@tiptap/extension-color'
import '@tiptap/extension-font-family'
import '@tiptap/extension-hard-break'
import '@tiptap/extension-image'
import '@tiptap/extension-mention'
import '@tiptap/extension-placeholder'
import '@tiptap/extension-table'
import '@tiptap/extension-text-style'

import { createTiptapExtensionSchema } from '@neverkin/tiptap-schema'
import Mention from '@tiptap/extension-mention'
import Placeholder from '@tiptap/extension-placeholder'
import { Extensions } from '@tiptap/react'

import { ExternalImageNode } from './externalImage/ExternalImageNode'
import { MentionNode } from './mentions/components/MentionNode'
import { mentionsSuggestions } from './mentions/MentionsExtension'
import { TableKeyboardExtension } from './TableKeyboardExtension'
import { ThemeAwareTextStyle } from './textStyle/ThemeAwareTextStyle'

export const SharedExtensions = [
	...createTiptapExtensionSchema<Extensions>({
		ExternalImageNode,
		MentionNode,
		TextStyle: ThemeAwareTextStyle,
	}),
]

export const EditorExtensions: Extensions = [
	...SharedExtensions,
	Placeholder.configure({
		placeholder: 'Content',
		showOnlyWhenEditable: false,
	}),
	Mention.configure({
		suggestion: mentionsSuggestions,
	}),
	TableKeyboardExtension,
]

export const ViewerExtensions = [...SharedExtensions]
