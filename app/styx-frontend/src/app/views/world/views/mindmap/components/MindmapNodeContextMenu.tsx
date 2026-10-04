import Delete from '@mui/icons-material/Delete'
import Edit from '@mui/icons-material/Edit'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useState } from 'react'
import { useDispatch } from 'react-redux'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { dispatchGlobalEvent, useEventBusSubscribe } from '@/app/features/eventBus'
import { useModal } from '@/app/features/modals/ModalsSlice'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { useDeleteMindmapNodes } from '../api/useDeleteMindmapNodes'
import { mindmapSlice } from '../MindmapSlice'
import { MindmapNodeParentParcel } from '../types'

export function MindmapNodeContextMenu() {
	const [open, setOpen] = useState(false)
	const [position, setPosition] = useState({ x: 0, y: 0 })
	const [node, setNode] = useState<MindmapNode | null>(null)
	const [parent, setParent] = useState<MindmapNodeParentParcel | null>(null)
	const dispatch = useDispatch()
	const navigate = useStableNavigate({ from: '/world/$worldId/mindmap' })

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

	const isStickyNote = parent.type === 'node' && parent.entity.content.length === 0

	return (
		<Menu
			anchorReference="anchorPosition"
			anchorPosition={{
				top: position.y,
				left: position.x,
			}}
			open={open}
			onClose={(_, reason) => {
				setOpen(false)
				if (reason === 'backdropClick') {
					dispatch(mindmapSlice.actions.clearSelections())
				}
			}}
			disableAutoFocusItem
			disableRestoreFocus
			disableEnforceFocus
		>
			{parent.type !== 'folder' && (
				<MenuItem
					onClick={() => {
						if (isStickyNote) {
							dispatchGlobalEvent['mindmap/node/requestEditPlainNode']({ nodeId: node.id })
						} else {
							navigate({ search: (prev) => ({ ...prev, navi: [parent.id] }) })
						}
						setOpen(false)
					}}
				>
					<ListItemIcon>
						<Edit />
					</ListItemIcon>
					<ListItemText>Edit</ListItemText>
				</MenuItem>
			)}
			{/* {isStickyNote && (
				<MenuItem
					onClick={() => {
						navigate({ search: (prev) => ({ ...prev, navi: [parent.id] }) })
						setOpen(false)
					}}
				>
					<ListItemIcon> 
						<OpenInFull />
					</ListItemIcon>
					<ListItemText>Edit as full entity</ListItemText>
				</MenuItem>
			)} */}
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
