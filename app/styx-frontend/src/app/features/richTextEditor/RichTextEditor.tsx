import Box from '@mui/material/Box'
import { useEditor } from '@tiptap/react'
import throttle from 'lodash.throttle'
import { memo, useEffect, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'

import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { useBrowserSpecificScrollbars } from '@/app/hooks/useBrowserSpecificScrollbars'

import { getWorldState } from '../../views/world/WorldSliceSelectors'
import { useEventBusSubscribe } from '../eventBus'
import { EditorContentBox } from './components/EditorContentBox'
import { useCollaboration } from './extensions/collaboration/useCollaboration'
import { EditorExtensions } from './extensions/editorExtensions'
import { useDocumentScrollMemory } from './hooks/useDocumentScrollMemory'
import { useEditorPasteHandler } from './hooks/useEditorPasteHandler'
import { RichTextEditorControls } from './RichTextEditorControls'
import { RichTextEditorQuickSelect } from './RichTextEditorQuickSelect'
import { StyledContainer } from './styles'

type Props = {
	value: string
	onChange: (params: OnChangeParams) => void
	onBlur?: () => void
	allowReadMode?: boolean
	// Collaboration params (optional)
	collaboration?: {
		entityType: 'actor' | 'event' | 'article' | 'node'
		documentId: string
	}
	autoFocus?: boolean
	surface?: string
}

export type RichTextEditorProps = Props

export type OnChangeParams = {
	plainText: string
	richText: string
}

export const RichTextEditor = memo(RichTextEditorComponent)

export function RichTextEditorComponent({
	value,
	onChange,
	onBlur,
	collaboration,
	autoFocus,
	surface = 'default',
}: Props) {
	const theme = useCustomTheme()
	const scrollbars = useBrowserSpecificScrollbars()
	const { isReadOnly } = useSelector(getWorldState, (a, b) => a.isReadOnly === b.isReadOnly)

	const { extension: collaborationExtension, hasSynced: collabSynced } = useCollaboration({
		enabled: !!collaboration,
		documentId: collaboration?.documentId ?? '',
		entityType: collaboration?.entityType ?? 'actor',
	})

	const onChangeRef = useRef(onChange)
	useEffect(() => {
		onChangeRef.current = onChange
	}, [onChange])

	const onChangeThrottled = useRef(
		throttle(({ plainText, richText }: { plainText: string; richText: string }) => {
			onChangeRef.current({
				plainText,
				richText,
			})
		}, 100),
	)

	useEffect(() => {
		onChangeThrottled.current.cancel()
	}, [collaboration?.documentId])

	// Add collaboration extension if enabled
	const extensions = useMemo(() => {
		return collaborationExtension ? [...EditorExtensions, collaborationExtension] : EditorExtensions
	}, [collaborationExtension])

	const { handlePaste } = useEditorPasteHandler()

	const showPreview = !!collaboration && !collabSynced
	const previewEditor = useEditor({
		content: value,
		editable: false,
		extensions: EditorExtensions,
	})

	const previewSyncedDocId = useRef(collaboration?.documentId)
	if (
		previewEditor &&
		!previewEditor.isDestroyed &&
		collaboration?.documentId &&
		previewSyncedDocId.current !== collaboration.documentId
	) {
		previewEditor.chain().setContent(value).setTextSelection(0).run()
		previewSyncedDocId.current = collaboration.documentId
	}

	const editor = useEditor(
		{
			extensions,
			autofocus: autoFocus,
			editorProps: {
				handlePaste,
			},
			onUpdate({ editor, transaction }) {
				const richText = editor.getHTML()
				if (richText === value || transaction.steps.length === 0) {
					return
				}
				onChangeThrottled.current({
					plainText: editor.getText(),
					richText,
				})
			},
		},
		[extensions],
	)

	const displayedEditor = showPreview && previewEditor ? previewEditor : editor

	const { containerRef: scrollContainerRef, onScroll } = useDocumentScrollMemory(
		collaboration?.documentId ? `${surface}:${collaboration.documentId}` : undefined,
		displayedEditor,
	)

	const currentValue = useRef(value)

	useEffect(() => {
		currentValue.current = value
	}, [value])

	useEffect(() => {
		const editable = !isReadOnly && (!collaboration || collabSynced)
		editor?.setEditable(editable)
	}, [collabSynced, collaboration, editor, isReadOnly])

	useEventBusSubscribe['richEditor/requestFocus']({
		callback: () => {
			editor?.commands.focus()
			editor?.commands.selectTextblockEnd()
		},
	})
	useEventBusSubscribe['richEditor/requestBlur']({
		callback: () => {
			editor?.commands.blur()
		},
	})

	const isPageScroll = surface === 'wiki'

	return (
		<StyledContainer
			sx={{
				borderRadius: isPageScroll ? 0 : '6px',
				minHeight: '128px',
				background: isReadOnly ? '' : theme.custom.palette.background.textEditor,
				display: 'flex',
				flexDirection: 'column',
			}}
			data-testid="RichTextEditor"
			$theme={theme}
			$fluid={isPageScroll}
			onBlur={() => {
				onBlur?.()
				onChangeThrottled.current.cancel()
			}}
		>
			<RichTextEditorControls editor={displayedEditor} sticky={isPageScroll} />
			<Box
				ref={isPageScroll ? undefined : scrollContainerRef}
				onScroll={isPageScroll ? undefined : onScroll}
				sx={
					isPageScroll
						? { position: 'relative', flex: 1 }
						: { position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', ...scrollbars }
				}
			>
				{showPreview && previewEditor ? (
					<EditorContentBox
						className="content"
						editor={previewEditor}
						mode={isReadOnly ? 'read' : 'edit'}
						readOnly={isReadOnly}
					></EditorContentBox>
				) : (
					editor && (
						<EditorContentBox
							className="content"
							editor={editor}
							mode={isReadOnly ? 'read' : 'edit'}
						></EditorContentBox>
					)
				)}
			</Box>
			<RichTextEditorQuickSelect editor={editor} />
		</StyledContainer>
	)
}
