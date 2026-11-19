import CallMerge from '@mui/icons-material/CallMerge'
import Delete from '@mui/icons-material/Delete'
import LinkOff from '@mui/icons-material/LinkOff'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useMemo, useState } from 'react'

import { useEventBusSubscribe } from '@/app/features/eventBus'
import { pluralize } from '@/app/utils/pluralize'
import { WikiContextMenuColorPicker } from '@/app/views/world/views/wiki/components/WikiContextMenuColorPicker'

import { useMindmapContext, useMindmapSelectionContext } from '../context/useMindmapContext'
import { MindmapNodeParentParcel } from '../types'
import { toWorkspaceCoords } from '../utils/toWorkspaceCoords'
import { nearestWirePoint } from '../workspace/content/wires/canvas/MindmapCanvasMath'

export function MindmapBulkContextMenu() {
	const [open, setOpen] = useState(false)
	const [position, setPosition] = useState({ x: 0, y: 0 })
	const [targetNodes, setTargetNodes] = useState<string[]>([])
	const [targetWires, setTargetWires] = useState<string[]>([])
	const [targetParents, setTargetParents] = useState<MindmapNodeParentParcel[]>([])
	const [releasable, setReleasable] = useState({ wireCount: 0, waypointIds: [] as string[] })
	const { nodes, wires, wireGeometry, deleteNodes, deleteWires, createWaypoints, deleteWaypoints } =
		useMindmapContext()

	const { selectedNodes, selectedWires } = useMindmapSelectionContext()

	useEventBusSubscribe['mindmap/bulk/requestOpenContextMenu']({
		callback: (params) => {
			const nodeIds = selectedNodes.keys()
			setOpen(true)
			setPosition(params.position)
			setTargetNodes(nodeIds)
			setTargetWires(selectedWires.keys())
			setTargetParents(nodeIds.flatMap((nodeId) => nodes.get(nodeId)?.parent ?? []))
			const waypointsPerWire = selectedWires.keys().map((wireId) => wires.get(wireId)?.wire.waypoints ?? [])
			setReleasable({
				wireCount: waypointsPerWire.filter((waypoints) => waypoints.length > 0).length,
				waypointIds: waypointsPerWire.flat().map((waypoint) => waypoint.id),
			})
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

	const collectWires = () => {
		const point = toWorkspaceCoords({ screenX: position.x, screenY: position.y })
		if (!point) {
			return
		}
		createWaypoints({
			targets: targetWires.map((wireId) => ({
				wireId,
				index: nearestWirePoint(wireGeometry.get(wireId) ?? [], point).index,
			})),
			positionX: Math.round(point.x),
			positionY: Math.round(point.y),
		})
		setOpen(false)
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
			{targetParents.length > 0 && (
				<WikiContextMenuColorPicker entities={targetParents} onClose={() => setOpen(false)} />
			)}
			{targetParents.length > 0 && <Divider sx={{ my: 1 }} />}
			{targetWires.length > 1 && (
				<MenuItem onClick={collectWires}>
					<ListItemIcon>
						<CallMerge />
					</ListItemIcon>
					<ListItemText>Collect {targetWires.length} links here</ListItemText>
				</MenuItem>
			)}
			{releasable.wireCount > 0 && (
				<MenuItem
					onClick={() => {
						deleteWaypoints(releasable.waypointIds)
						setOpen(false)
					}}
				>
					<ListItemIcon>
						<LinkOff />
					</ListItemIcon>
					<ListItemText>Release {pluralize(releasable.wireCount, 'link')}</ListItemText>
				</MenuItem>
			)}
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
