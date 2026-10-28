import Box from '@mui/material/Box'
import { memo } from 'react'

import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { PlainMindmapNodeParcel } from '@/app/views/world/views/mindmap/types'

import { NODE_W } from '../MindmapNodeRenderer'
import { MindmapNodePort } from '../port/MindmapNodePort'
import { MindmapNodeContentStickyNoteEditor } from './MindmapNodeContentStickyNoteEditor'

type Props = {
	nodeId: string
	parent: PlainMindmapNodeParcel
	onHeaderClick?: (e: React.MouseEvent) => void
}

export const MindmapNodeContentStickyNote = memo(MindmapNodeContentStickyNoteComponent)

function MindmapNodeContentStickyNoteComponent({ nodeId, parent, onHeaderClick }: Props) {
	const { userDefinedColor } = useCustomTheme().custom.palette

	return (
		<Box
			data-mindmap-header
			onClick={onHeaderClick}
			sx={{
				userSelect: 'none',
				boxSizing: 'border-box',
				width: `${NODE_W}px`,
				padding: '16px 32px',
				position: 'relative',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				borderRadius: '15px',
				background: userDefinedColor.fill(parent.color),
				outline: `calc(1px / var(--grid-scale)) solid ${userDefinedColor.border(parent.color)}`,
				outlineOffset: 'calc(-1px / var(--grid-scale))',
				'&:hover': {
					outlineColor: userDefinedColor.borderHover(parent.color),
				},
				'&:active': {
					outlineColor: userDefinedColor.borderActive(parent.color),
				},
				'[data-selected="true"] &': {
					outlineColor: userDefinedColor.borderSelected(parent.color),
					'&:active': {
						outlineColor: userDefinedColor.borderSelectedActive(parent.color),
					},
				},
			}}
		>
			<MindmapNodeContentStickyNoteEditor nodeId={nodeId} name={parent.name} />
			<Box sx={{ position: 'absolute', top: 0, right: 0 }}>
				<MindmapNodePort nodeId={nodeId} parent={parent} />
			</Box>
		</Box>
	)
}
