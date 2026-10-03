import Delete from '@mui/icons-material/Delete'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import { useEventBusSubscribe } from '@/app/features/eventBus'

import { useDeleteMindmapNodes } from '../api/useDeleteMindmapNodes'
import { useDeleteMindmapWires } from '../api/useDeleteMindmapWires'
import { getMindmapState } from '../MindmapSliceSelectors'

export function MindmapBulkContextMenu() {
	const [open, setOpen] = useState(false)
	const [position, setPosition] = useState({ x: 0, y: 0 })

	const { selectedNodes, selectedWires } = useSelector(
		getMindmapState,
		(a, b) => a.selectedNodes === b.selectedNodes && a.selectedWires === b.selectedWires,
	)

	const [deleteMindmapNodes] = useDeleteMindmapNodes()
	const [deleteMindmapWires] = useDeleteMindmapWires()

	useEventBusSubscribe['mindmap/bulk/requestOpenContextMenu']({
		callback: (params) => {
			setOpen(true)
			setPosition(params.position)
		},
	})

	const bulkDeleteLabel = useMemo(() => {
		if (selectedNodes.length > 0 && selectedWires.length === 0) {
			return `Delete ${selectedNodes.length} nodes`
		}
		if (selectedWires.length > 0 && selectedNodes.length === 0) {
			return `Delete ${selectedWires.length} links`
		}
		return `Delete ${selectedNodes.length + selectedWires.length} items`
	}, [selectedNodes, selectedWires])

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
					deleteMindmapNodes(selectedNodes.map((node) => node.key))
					deleteMindmapWires(selectedWires)
					setOpen(false)
				}}
			>
				<ListItemIcon>
					<Delete />
				</ListItemIcon>
				<ListItemText color="error">{bulkDeleteLabel}</ListItemText>
			</MenuItem>
		</Menu>
	)
}
