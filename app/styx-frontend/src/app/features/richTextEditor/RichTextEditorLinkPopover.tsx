import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import PublicIcon from '@mui/icons-material/Public'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { Editor, useEditorState } from '@tiptap/react'
import { BubbleMenu, BubbleMenuProps } from '@tiptap/react/menus'

import { InsertLinkButton } from './components/controls/InsertLinkButton'
import { ToolbarButton } from './components/controls/ToolbarButton'

type Props = {
	editor: Editor
}

export function RichTextEditorLinkPopover({ editor }: Props) {
	const href = useEditorState({
		editor,
		selector: (ctx): string => ctx.editor.getAttributes('link').href ?? '',
	})

	const shouldShow: BubbleMenuProps['shouldShow'] = ({ editor, view, state, element }) => {
		if (!editor.isEditable) {
			return false
		}

		const isFocused = view.hasFocus() || element.contains(document.activeElement)
		if (!isFocused) {
			return false
		}

		const { $from, $to } = state.selection
		const linkBeforeCursor = $from.nodeBefore?.marks.find((mark) => mark.type.name === 'link')
		const nodeAfterCursor = $to.nodeAfter
		if (!linkBeforeCursor || !nodeAfterCursor) {
			return false
		}

		return linkBeforeCursor.isInSet(nodeAfterCursor.marks)
	}

	const onCopy = () => {
		navigator.clipboard.writeText(href)
	}

	const onMakeText = () => {
		editor.chain().focus().extendMarkRange('link').unsetLink().run()
	}

	return (
		<BubbleMenu
			editor={editor}
			pluginKey="linkBubble"
			shouldShow={shouldShow}
			options={{ placement: 'bottom-start' }}
		>
			<Paper elevation={4}>
				<Stack direction="row" alignItems="center" sx={{ paddingLeft: 2 }}>
					<PublicIcon fontSize="small" color="action" />
					<Link
						href={href}
						target="_blank"
						rel="noopener noreferrer"
						noWrap
						sx={{ maxWidth: 280, paddingLeft: 1, paddingRight: 1 }}
					>
						{href}
					</Link>
					<ToolbarButton tooltip="Copy link" onClick={onCopy}>
						<ContentCopyIcon fontSize="small" />
					</ToolbarButton>
					<InsertLinkButton editor={editor} />
					<ToolbarButton tooltip="Make text" onClick={onMakeText}>
						<LinkOffIcon fontSize="small" />
					</ToolbarButton>
				</Stack>
			</Paper>
		</BubbleMenu>
	)
}
