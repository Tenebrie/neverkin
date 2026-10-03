import Box from '@mui/material/Box'
import { memo } from 'react'

import { PlainMindmapNodeParcel } from '@/app/views/world/views/mindmap/types'

import { NODE_W } from '../ActorNode'
import { MindmapNodePort } from '../MindmapNodePort'
import { ActorNodeContentStickyNoteEditor } from './ActorNodeContentStickyNoteEditor'

type Props = {
	nodeId: string
	parent: PlainMindmapNodeParcel
	onHeaderClick?: (e: React.MouseEvent) => void
}

export const ActorNodeContentStickyNote = memo(ActorNodeContentStickyNoteComponent)

function ActorNodeContentStickyNoteComponent({ nodeId, parent, onHeaderClick }: Props) {
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
			<ActorNodeContentStickyNoteEditor nodeId={nodeId} name={parent.name} />
			<Box sx={{ position: 'absolute', top: 0, right: 0 }}>
				<MindmapNodePort nodeId={nodeId} parent={parent} />
			</Box>
		</Box>
	)
}
