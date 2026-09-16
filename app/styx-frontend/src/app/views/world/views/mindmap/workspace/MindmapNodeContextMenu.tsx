import Delete from '@mui/icons-material/Delete'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useState } from 'react'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { useEventBusSubscribe } from '@/app/features/eventBus'
import { useModal } from '@/app/features/modals/ModalsSlice'

import { useDeleteMindmapNodes } from '../api/useDeleteMindmapNodes'
import { BoxedMindmapParent } from '../hooks/useBoxedMindmapContent'

export function MindmapNodeContextMenu() {
	const [open, setOpen] = useState(false)
	const [position, setPosition] = useState({ x: 0, y: 0 })
	const [node, setNode] = useState<MindmapNode | null>(null)
	const [parent, setParent] = useState<BoxedMindmapParent | null>(null)

	const { open: openBulkDeleteEntitiesModal } = useModal('bulkDeleteEntitiesModal')

	const [deleteNode] = useDeleteMindmapNodes()

	useEventBusSubscribe['mindmap/node/requestOpenContextMenu']({
		callback: (params) => {
			setOpen(true)
			setPosition(params.position)
			setNode(params.node)
			setParent(params.parent)
		},
	})

	if (!node || !parent) {
		return
	}

	return (
		<Menu
			anchorReference="anchorPosition"
			anchorPosition={{
				top: position.y,
				left: position.x,
			}}
			open={open}
			onClose={() => setOpen(false)}
			disableAutoFocusItem
			disableRestoreFocus
			disableEnforceFocus
		>
			<MenuItem
				color="error"
				onClick={() => {
					deleteNode([node.id])
					setOpen(false)
				}}
			>
				<ListItemIcon>
					<Delete />
				</ListItemIcon>
				<ListItemText>Delete node</ListItemText>
			</MenuItem>
			{parent.type !== 'node' && (
				<MenuItem
					sx={{ color: 'error.main' }}
					onClick={() => {
						openBulkDeleteEntitiesModal({ articles: [parent.id] })
						setOpen(false)
					}}
				>
					<ListItemIcon>
						<Delete />
					</ListItemIcon>
					<ListItemText>Delete {parent.type}</ListItemText>
				</MenuItem>
			)}
		</Menu>
	)
}
