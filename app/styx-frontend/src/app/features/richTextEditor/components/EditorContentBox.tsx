import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import { MAX_INDENT_LEVEL } from '@neverkin/tiptap-schema'
import { Editor } from '@tiptap/core'
import { EditorContent } from '@tiptap/react'
import { memo } from 'react'

import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'

type Props = {
	editor: Editor
	mode: 'read' | 'edit'
	className?: string
	readOnly?: boolean
	children?: React.ReactNode
}

export const EditorContentBox = memo(EditorContentBoxComponent)

function EditorContentBoxComponent({ editor, mode, className, readOnly, children }: Props) {
	const { palette } = useTheme()
	const isDark = palette.mode === 'dark'
	const theme = useCustomTheme()

	return (
		<Box
			component={EditorContent}
			className={className}
			editor={editor}
			readOnly={readOnly}
			sx={{
				fontFamily: '"Roboto", sans-serif',
				outline: 'none',
				height: mode === 'edit' ? '100%' : 'unset',
				overflowY: 'visible',
				display: 'flex',
				flexDirection: 'column',

				'& img': {
					maxHeight: '400px',
					maxWidth: '100%',
				},

				'& .ProseMirror': {
					flex: 1,
					outline: 'none',
					minHeight: '1rem',
					height: '100%',
					padding: mode === 'edit' ? '0 16px' : 'unset',
					color: 'text.primary',

					'& > p:first-of-type': {
						paddingTop: '16px',
					},
				},

				'& p': {
					margin: 0,
					padding: '10px 0px',
					lineHeight: 1.55,
					tabSize: '2em',
					wordBreak: 'break-word',
					color: isDark ? '#D8D8E0' : 'text.primary',
				},

				'& h1, & h2, & h3, & h4, & h5, & h6': {
					marginBottom: '0.4em',
					...(isDark ? { color: '#ECECF2' } : {}),
				},

				'& li > p': {
					padding: '3px 0',
				},

				'& span[data-type="tab"]': {
					whiteSpace: 'pre-wrap',
				},

				...Object.fromEntries(
					Array.from({ length: MAX_INDENT_LEVEL }, (_, i) => [
						`& [data-indent="${i + 1}"]`,
						{ paddingLeft: `${(i + 1) * 2}em` },
					]),
				),

				'& :not(pre) > code': {
					padding: '4px 8px',
					borderRadius: '4px',
					background: theme.custom.palette.neutralBackground.soft,
				},

				'& pre': {
					margin: '10px 0',
					padding: '8px 12px',
					borderRadius: '4px',
					background: theme.custom.palette.neutralBackground.soft,
					tabSize: 2,
				},

				'& blockquote': {
					margin: '10px 0',
					padding: '0 16px',
					borderLeft: '4px solid',
					borderRadius: '4px',
					borderColor: 'secondary.main',
					background: theme.custom.palette.neutralBackground.soft,
				},

				'& span[data-luminance="dark"]': isDark
					? { color: 'oklch(from var(--text-color) calc(1 - l) c h) !important' }
					: {},
				'& span[data-luminance="light"]': !isDark
					? { color: 'oklch(from var(--text-color) calc(1 - l) c h) !important' }
					: {},

				'& .tableWrapper': {
					margin: '1rem 0',
					overflowX: 'auto',
				},
				'& table': {
					borderCollapse: 'collapse',
					tableLayout: 'fixed',
					width: '100%',
					overflow: 'hidden',
				},
				'& td, & th': {
					border: '1px solid',
					borderColor: 'divider',
					boxSizing: 'border-box',
					minWidth: '2em',
					padding: '6px 10px',
					position: 'relative',
					verticalAlign: 'top',
					'& > *': { marginBottom: 0 },
				},
				'& th': {
					backgroundColor: 'action.hover',
					fontWeight: 600,
					textAlign: 'left',
				},
				'& .selectedCell::after': {
					backgroundColor: 'primary.main',
					content: '""',
					inset: 0,
					opacity: 0.15,
					pointerEvents: 'none',
					position: 'absolute',
					zIndex: 2,
				},
			}}
		>
			{children}
		</Box>
	)
}
