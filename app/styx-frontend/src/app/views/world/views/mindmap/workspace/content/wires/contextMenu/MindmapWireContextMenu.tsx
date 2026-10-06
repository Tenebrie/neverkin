import CallSplit from '@mui/icons-material/CallSplit'
import Delete from '@mui/icons-material/Delete'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import Popover from '@mui/material/Popover'
import { useCallback, useMemo, useState } from 'react'

import { MindmapWireDirection } from '@/api/types/mindmapTypes'
import { Shortcut, ShortcutPriorities, useShortcut } from '@/app/hooks/useShortcut/useShortcut'
import { useMindmapData } from '@/app/views/world/views/mindmap/api/useMindmapData'
import { useMindmapContext } from '@/app/views/world/views/mindmap/context/useMindmapContext'

import { NODE_FALLBACK_H, NODE_W } from '../../nodes/MindmapNodeRenderer'
import { midpointOf } from '../canvas/MindmapCanvasMath'
import { MindmapWireContextMenuEditor } from './MindmapWireContextMenuEditor'

export type MindmapWireState = {
	open: boolean
	wireId: string | null
	position: { x: number; y: number }
	onClose: () => void
	mode: 'doubleClick' | 'contextMenu'
}

export function MindmapWireContextMenu({ open, wireId, position, onClose }: MindmapWireState) {
	const { wires } = useMindmapData()
	const { wireGeometry, splitWire, updateWire, deleteWires } = useMindmapContext()

	const currentWire = useMemo(() => wires.find((wire) => wire.id === wireId), [wireId, wires])

	const [label, setLabel] = useState(currentWire?.content ?? '')
	const [direction, setDirection] = useState<MindmapWireDirection>(currentWire?.direction ?? 'Normal')

	const handleClose = useCallback(() => {
		if (currentWire && (label !== currentWire.content || direction !== currentWire.direction)) {
			updateWire(currentWire.id, {
				content: label,
				direction: direction,
			})
		}
		onClose()
	}, [currentWire, direction, label, onClose, updateWire])

	const handleSplit = useCallback(() => {
		const curve = currentWire ? wireGeometry.get(currentWire.id) : undefined
		const midpoint = curve ? midpointOf(curve) : null
		if (!currentWire || !midpoint) {
			return
		}
		splitWire(currentWire.id, {
			positionX: Math.round(midpoint.x) - NODE_W / 2,
			positionY: Math.round(midpoint.y) - NODE_FALLBACK_H / 2,
			name: label,
			direction,
		})
		onClose()
	}, [currentWire, direction, label, onClose, splitWire, wireGeometry])

	useShortcut([Shortcut.Enter, Shortcut.CtrlEnter], handleClose, open && ShortcutPriorities.InputField)

	return (
		<Popover
			open={open}
			onClose={handleClose}
			sx={{
				maxWidth: 480,
				left: position.x - 16,
				top: position.y - 16,
				pointerEvents: open ? 'auto' : 'none',
			}}
			onContextMenu={(event) => {
				event.preventDefault()
				handleClose()
			}}
		>
			{currentWire && (
				<MindmapWireContextMenuEditor
					currentWire={currentWire}
					label={label}
					setLabel={setLabel}
					direction={direction}
					setDirection={setDirection}
				/>
			)}
			{currentWire && <Divider />}
			<MenuList sx={{ minWidth: 200 }}>
				{currentWire && (
					<MenuItem onClick={handleSplit}>
						<ListItemIcon>
							<CallSplit />
						</ListItemIcon>
						<ListItemText>Split</ListItemText>
					</MenuItem>
				)}
				<MenuItem
					color="error"
					onClick={() => {
						if (wireId) {
							deleteWires([wireId])
						}
						handleClose()
					}}
				>
					<ListItemIcon>
						<Delete />
					</ListItemIcon>
					<ListItemText color="error">Delete link</ListItemText>
				</MenuItem>
			</MenuList>
		</Popover>
	)
}
