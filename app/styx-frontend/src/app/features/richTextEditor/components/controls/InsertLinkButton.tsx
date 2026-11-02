import InsertLinkIcon from '@mui/icons-material/InsertLink'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { getMarkRange } from '@tiptap/core'
import { Editor } from '@tiptap/react'
import { useState } from 'react'

import { ActiveButtonIndicator } from '@/app/features/richTextEditor/extensions/mentions/components/ActiveButtonIndicator'
import { Header } from '@/ui-lib/components/Header/Header'

import { useEditorMarkActive } from '../../hooks/useEditorMarkActive'
import { ToolbarPopoverButton } from './ToolbarPopoverButton'

type Props = {
	editor: Editor
}

export function InsertLinkButton({ editor }: Props) {
	const isInLink = useEditorMarkActive(editor, 'link')
	const [url, setUrl] = useState('')
	const [label, setLabel] = useState('')

	const onOpen = () => {
		setUrl(editor.getAttributes('link').href ?? '')
		setLabel(getLinkTarget(editor).text)
	}

	const onConfirm = () => {
		if (!url.trim()) {
			return
		}
		const href = withProtocol(url.trim())
		const text = label || href
		const target = getLinkTarget(editor)
		const chain = editor.chain().focus().setTextSelection(target)
		if (text === target.text) {
			chain.setLink({ href }).run()
		} else {
			chain.insertContent({ type: 'text', text, marks: [{ type: 'link', attrs: { href } }] }).run()
		}
	}

	return (
		<ToolbarPopoverButton
			content={
				<>
					<InsertLinkIcon fontSize="small" />
					<ActiveButtonIndicator active={isInLink} />
				</>
			}
			tooltip={isInLink ? 'Edit link' : 'Insert link'}
			autofocus
			onCleanup={onOpen}
			onEnterKey={({ close }) => {
				onConfirm()
				close()
			}}
			popoverBody={() => (
				<>
					<Header variant="h3">Insert a link</Header>
					<TextField
						size="small"
						type="url"
						label="URL"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						fullWidth
					/>
					<TextField
						size="small"
						label="Label"
						placeholder="Label (optional)"
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						fullWidth
					/>
				</>
			)}
			popoverAction={({ close }) => (
				<Button
					variant="contained"
					disabled={!url.trim()}
					onClick={() => {
						onConfirm()
						close()
					}}
					fullWidth
				>
					{isInLink ? 'Update link' : 'Insert link'}
				</Button>
			)}
			popoverSx={{ padding: 2, width: 320 }}
			popoverAlign={{ vertical: 'bottom', horizontal: 'left' }}
		/>
	)
}

function getLinkTarget(editor: Editor) {
	const { selection, schema, doc } = editor.state
	const { from, to } = getMarkRange(selection.$from, schema.marks.link) ?? selection
	return { from, to, text: doc.textBetween(from, to) }
}

function withProtocol(url: string) {
	if (/^[a-z][a-z\d+.-]*:/i.test(url)) {
		return url
	}
	return `http://${url}`
}
