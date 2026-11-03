import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import Typography from '@mui/material/Typography'
import { Editor, useEditorState } from '@tiptap/react'
import { useCallback, useState } from 'react'

import { ActiveButtonIndicator } from '@/app/features/richTextEditor/extensions/mentions/components/ActiveButtonIndicator'

import { ToolbarPopoverButton } from './ToolbarPopoverButton'

type Props = {
	editor: Editor
}

const GRID_ROWS = 6
const GRID_COLS = 8

export function TableInsertButton({ editor }: Props) {
	const isInTable = useEditorState({
		editor,
		selector: (ctx) => ctx.editor.isActive('table'),
	})

	return (
		<ToolbarPopoverButton
			content={
				<>
					Table
					<ArrowDropDownIcon sx={{ fontSize: 20, ml: 1, mr: '-4px' }} />
					<ActiveButtonIndicator active={isInTable} />
				</>
			}
			tooltip={isInTable ? 'Table options' : 'Insert table'}
			buttonSx={{ padding: '0 4px 0 8px', fontSize: '0.875rem' }}
			popoverBody={({ close }) =>
				isInTable ? (
					<TableOptionsList editor={editor} onClose={close} />
				) : (
					<TableGridPicker editor={editor} onClose={close} />
				)
			}
			popoverAction={() => null}
			popoverSx={isInTable ? { padding: 0 } : { padding: 1.5 }}
			popoverAlign={{ vertical: 'bottom', horizontal: 'left' }}
		/>
	)
}

function TableOptionsList({ editor, onClose }: { editor: Editor; onClose: () => void }) {
	const run = useCallback(
		(cmd: () => boolean) => {
			cmd()
			onClose()
		},
		[onClose],
	)

	return (
		<MenuList sx={{ minWidth: 180 }}>
			<MenuItem onClick={() => run(() => editor.chain().focus().toggleHeaderCell().run())}>
				Toggle header cell
			</MenuItem>
			<Divider />
			<MenuItem onClick={() => run(() => editor.chain().focus().addRowBefore().run())}>
				Insert row above
			</MenuItem>
			<MenuItem onClick={() => run(() => editor.chain().focus().addRowAfter().run())}>
				Insert row below
			</MenuItem>
			<MenuItem onClick={() => run(() => editor.chain().focus().deleteRow().run())}>Delete row</MenuItem>
			<Divider />
			<MenuItem onClick={() => run(() => editor.chain().focus().addColumnBefore().run())}>
				Insert column before
			</MenuItem>
			<MenuItem onClick={() => run(() => editor.chain().focus().addColumnAfter().run())}>
				Insert column after
			</MenuItem>
			<MenuItem onClick={() => run(() => editor.chain().focus().deleteColumn().run())}>
				Delete column
			</MenuItem>
			<Divider />
			<MenuItem
				onClick={() => run(() => editor.chain().focus().deleteTable().run())}
				sx={{ color: 'error.main' }}
			>
				Delete table
			</MenuItem>
		</MenuList>
	)
}

function TableGridPicker({ editor, onClose }: { editor: Editor; onClose: () => void }) {
	const [hovered, setHovered] = useState<{ row: number; col: number } | null>(null)

	const handleClick = (row: number, col: number) => {
		editor.chain().focus().insertTable({ rows: row, cols: col, withHeaderRow: true }).run()
		onClose()
	}

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: `repeat(${GRID_COLS}, 20px)`,
					gap: '2px',
					cursor: 'pointer',
				}}
				onMouseLeave={() => setHovered(null)}
			>
				{Array.from({ length: GRID_ROWS * GRID_COLS }, (_, i) => {
					const row = Math.floor(i / GRID_COLS) + 1
					const col = (i % GRID_COLS) + 1
					const isActive = hovered !== null && row <= hovered.row && col <= hovered.col
					return (
						<Box
							key={i}
							onMouseEnter={() => setHovered({ row, col })}
							onClick={() => handleClick(row, col)}
							sx={{
								width: 18,
								height: 18,
								border: '1px solid',
								borderColor: isActive ? 'primary.main' : 'divider',
								bgcolor: isActive ? 'primary.main' : 'transparent',
								opacity: isActive ? 0.45 : 1,
								borderRadius: '2px',
							}}
						/>
					)
				})}
			</Box>
			<Typography variant="caption" color="text.secondary" align="center">
				{hovered ? `${hovered.row} × ${hovered.col} table` : 'Select size'}
			</Typography>
		</Box>
	)
}
