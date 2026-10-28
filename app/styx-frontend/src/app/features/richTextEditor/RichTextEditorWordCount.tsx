import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { Node } from '@tiptap/pm/model'
import { Editor, EditorEvents } from '@tiptap/react'
import debounce from 'lodash.debounce'
import { useEffect, useState } from 'react'

import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { pluralize } from '@/app/utils/pluralize'
import { MAX_CONTENT_LENGTH } from '@/ts-shared/const/constants'
import { Tooltip } from '@/ui-lib/components/Tooltip'

import { getMentionName, MentionNodeName } from './extensions/mentions/components/MentionNode'

export const WORD_COUNT_ANCHOR = '--rich-text-editor-word-count'

type Props = {
	editor: Editor
}

type DocumentStats = {
	paragraphs: number
	words: number
	characters: number
	bytes: number
	isOverLimit: boolean
}

export function RichTextEditorWordCount({ editor }: Props) {
	const theme = useCustomTheme()
	const [stats, setStats] = useState<DocumentStats | null>(null)

	useEffect(() => {
		const recount = debounce(() => {
			const doc = editor.state.doc
			const html = editor.getHTML()

			const leafText = (leaf: Node) => {
				if (leaf.type.name === MentionNodeName) {
					return getMentionName(leaf)
				}
				return ' '
			}
			const wordText = doc.textBetween(0, doc.content.size, ' ', leafText)
			const characterText = doc.textBetween(0, doc.content.size, undefined, leafText)

			let paragraphs = 0
			doc.descendants((node) => {
				if (node.type.name === 'paragraph' && node.childCount > 0) {
					paragraphs += 1
				}
				return !node.isTextblock
			})

			setStats({
				paragraphs,
				words: wordText.split(' ').filter((word) => word !== '').length,
				characters: characterText.length,
				bytes: new TextEncoder().encode(html).byteLength,
				isOverLimit: html.length > MAX_CONTENT_LENGTH,
			})
		}, 500)

		const onUpdate = ({ transaction }: EditorEvents['update']) => {
			if (transaction.docChanged) {
				recount()
			}
		}

		editor.on('update', onUpdate)
		recount()
		recount.flush()

		return () => {
			editor.off('update', onUpdate)
			recount.cancel()
		}
	}, [editor])

	if (!stats) {
		return null
	}

	return (
		<Box
			sx={{
				position: 'absolute',
				positionAnchor: WORD_COUNT_ANCHOR,
				positionArea: 'center',
				positionVisibility: 'anchors-valid',
			}}
		>
			<Tooltip
				title={
					<Stack gap={1}>
						{pluralize(stats.paragraphs, 'paragraph')}
						<br />
						{pluralize(stats.words, 'word')}
						<br />
						{pluralize(stats.characters, 'character')}
						<br />
						<Divider />
						{sizeFormat.format(stats.bytes / 1000)} / {sizeFormat.format(MAX_CONTENT_LENGTH / 1000)}
						{stats.isOverLimit && (
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
						color: stats.isOverLimit ? 'error.main' : 'text.secondary',
						backgroundColor: theme.custom.palette.neutralBackground.softer,
						opacity: stats.isOverLimit ? 1 : 0.7,
						borderRadius: '12px',
						userSelect: 'none',
						cursor: 'default',
					}}
				>
					{stats.words.toLocaleString()}
				</Box>
			</Tooltip>
		</Box>
	)
}

const sizeFormat = new Intl.NumberFormat(undefined, {
	style: 'unit',
	unit: 'kilobyte',
	maximumFractionDigits: 1,
})
