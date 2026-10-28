import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { Node } from '@tiptap/pm/model'
import { Editor, EditorEvents, getHTMLFromFragment } from '@tiptap/react'
import debounce from 'lodash.debounce'
import { useEffect, useState } from 'react'

import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { pluralize } from '@/app/utils/pluralize'
import { MAX_CONTENT_LENGTH } from '@/ts-shared/const/constants'
import { Tooltip } from '@/ui-lib/components/Tooltip'

import { getMentionName, MentionNodeName } from './extensions/mentions/components/MentionNode'

// const MAX_CONTENT_LENGTH = 100

type Props = {
	editor: Editor
}

export function RichTextEditorWordCount({ editor }: Props) {
	const theme = useCustomTheme()
	const [counted, setCounted] = useState({ editor, doc: editor.state.doc })
	if (counted.editor !== editor) {
		setCounted({ editor, doc: editor.state.doc })
	}

	useEffect(() => {
		const recount = debounce(() => setCounted({ editor, doc: editor.state.doc }), 500)
		const onUpdate = ({ transaction }: EditorEvents['update']) => {
			if (transaction.docChanged) {
				recount()
			}
		}
		editor.on('update', onUpdate)
		return () => {
			editor.off('update', onUpdate)
			recount.cancel()
		}
	}, [editor])

	const docSize = counted.doc.content.size
	const words = counted.doc
		.textBetween(0, docSize, ' ', leafToText)
		.split(' ')
		.filter((word) => word !== '').length
	const characters = counted.doc.textBetween(0, docSize, undefined, leafToText).length
	const paragraphs = countParagraphs(counted.doc)
	const html = getHTMLFromFragment(counted.doc.content, editor.schema)
	const bytes = new TextEncoder().encode(html).byteLength
	const isOverLimit = html.length > MAX_CONTENT_LENGTH

	return (
		<Tooltip
			title={
				<Stack gap={1}>
					{pluralize(paragraphs, 'paragraph')}
					<br />
					{pluralize(words, 'word')}
					<br />
					{pluralize(characters, 'character')}
					<br />
					<Divider />
					{sizeFormat.format(bytes / 1000)} / {sizeFormat.format(MAX_CONTENT_LENGTH / 1000)}
					{isOverLimit && (
						<>
							<br />
							Too large to save. Changes will not be saved until the content is shorter.
						</>
					)}
				</Stack>
			}
			placement="right"
		>
			<Box
				component="span"
				sx={{
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'center',
					boxSizing: 'border-box',
					minWidth: 24,
					height: 24,
					px: 0.75,
					whiteSpace: 'nowrap',
					fontSize: 12,
					fontFamily: 'Roboto',
					color: isOverLimit ? 'error.main' : 'text.secondary',
					backgroundColor: theme.custom.palette.neutralBackground.softer,
					opacity: isOverLimit ? 1 : 0.7,
					borderRadius: '12px',
					userSelect: 'none',
					cursor: 'default',
				}}
			>
				{words.toLocaleString()}
			</Box>
		</Tooltip>
	)
}

function countParagraphs(doc: Node) {
	let paragraphs = 0
	doc.descendants((node) => {
		if (node.type.name === 'paragraph' && node.childCount > 0) {
			paragraphs += 1
		}
		return !node.isTextblock
	})
	return paragraphs
}

function leafToText(leaf: Node) {
	if (leaf.type.name === MentionNodeName) {
		return getMentionName(leaf)
	}
	return ' '
}

const sizeFormat = new Intl.NumberFormat(undefined, {
	style: 'unit',
	unit: 'kilobyte',
	maximumFractionDigits: 1,
})
