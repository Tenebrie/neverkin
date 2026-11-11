import Delete from '@mui/icons-material/Delete'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useMemo, useState } from 'react'

import { useEventBusSubscribe } from '@/app/features/eventBus'
import { WikiContextMenuColorPicker } from '@/app/views/world/views/wiki/components/WikiContextMenuColorPicker'

import { useMindmapContext, useMindmapSelectionContext } from '../context/useMindmapContext'
import { MindmapNodeParentParcel } from '../types'

export function MindmapBulkContextMenu() {
	const [open, setOpen] = useState(false)
	const [position, setPosition] = useState({ x: 0, y: 0 })
	const [targetNodes, setTargetNodes] = useState<string[]>([])
	const [targetWires, setTargetWires] = useState<string[]>([])
	const [targetParents, setTargetParents] = useState<MindmapNodeParentParcel[]>([])
	const { nodes, deleteNodes, deleteWires } = useMindmapContext()

	const { selectedNodes, selectedWires } = useMindmapSelectionContext()

	useEventBusSubscribe['mindmap/bulk/requestOpenContextMenu']({
		callback: (params) => {
			const nodeIds = selectedNodes.keys()
			setOpen(true)
			setPosition(params.position)
			setTargetNodes(nodeIds)
			setTargetWires(selectedWires.keys())
			setTargetParents(nodeIds.flatMap((nodeId) => nodes.get(nodeId)?.parent ?? []))
		},
	})

	const bulkDeleteLabel = useMemo(() => {
		if (targetNodes.length > 0 && targetWires.length === 0) {
			return `Delete ${targetNodes.length} nodes`
		}
		if (targetWires.length > 0 && targetNodes.length === 0) {
			return `Delete ${targetWires.length} links`
		}
		return `Delete ${targetNodes.length + targetWires.length} items`
	}, [targetNodes, targetWires])

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
			{targetParents.length > 0 && (
				<WikiContextMenuColorPicker entities={targetParents} onClose={() => setOpen(false)} />
			)}
			{targetParents.length > 0 && <Divider sx={{ my: 1 }} />}
			<MenuItem
				color="error"
				onClick={() => {
					deleteNodes(targetNodes)
					deleteWires(targetWires)
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
