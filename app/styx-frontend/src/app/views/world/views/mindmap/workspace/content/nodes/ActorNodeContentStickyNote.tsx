import Box from '@mui/material/Box'
import { memo } from 'react'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { PlainMindmapNodeParcel } from '@/app/views/world/views/mindmap/types'
import { NODE_W } from '@/app/views/world/views/mindmap/unrefactored/mindmapWireUtils'

import { ActorNodeContentStickyNoteEditor } from './ActorNodeContentStickyNoteEditor'
import { MindmapNodePort } from './MindmapNodePort'

type Props = {
	node?: MindmapNode
	parent: PlainMindmapNodeParcel
	onHeaderClick?: (e: React.MouseEvent) => void
}

export const ActorNodeContentStickyNote = memo(ActorNodeContentStickyNoteComponent)

function ActorNodeContentStickyNoteComponent({ node, parent, onHeaderClick }: Props) {
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
			}}
		>
			<ActorNodeContentStickyNoteEditor node={node} name={parent.name} />
			<Box sx={{ position: 'absolute', top: 0, right: 0 }}>
				<MindmapNodePort node={node} parent={parent} />
			</Box>
		</Box>
	)
}
