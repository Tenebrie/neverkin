import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { memo } from 'react'

import { MindmapNode } from '@/api/types/mindmapTypes'

import { BoxedPlainNode } from '../hooks/useBoxedMindmapContent'
import { MindmapNodePort } from './MindmapNodePort'
import { NODE_W } from './mindmapWireUtils'

type Props = {
	node?: MindmapNode
	parent: BoxedPlainNode
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
			<Typography
				sx={{
					textAlign: 'center',
					overflowWrap: 'anywhere',
					display: '-webkit-box',
					WebkitLineClamp: 8,
					WebkitBoxOrient: 'vertical',
					overflow: 'hidden',
				}}
			>
				{parent.name || <i>empty</i>}
			</Typography>
			<Box sx={{ position: 'absolute', top: 0, right: 0 }}>
				<MindmapNodePort node={node} parent={parent} />
			</Box>
		</Box>
	)
}
