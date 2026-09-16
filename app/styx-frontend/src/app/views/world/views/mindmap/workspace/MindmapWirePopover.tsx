import Delete from '@mui/icons-material/Delete'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import Popover from '@mui/material/Popover'
import { useCallback, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import { MindmapWireDirection } from '@/api/types/mindmapTypes'
import { Shortcut, ShortcutPriorities, useShortcut } from '@/app/hooks/useShortcut/useShortcut'

import { useDeleteMindmapWires } from '../api/useDeleteMindmapWires'
import { useMindmapData } from '../api/useMindmapData'
import { useUpdateMindmapWire } from '../api/useUpdateMindmapWire'
import { getSelectedWireKeys } from '../MindmapSliceSelectors'
import { MindmapWirePopoverEditor } from './MindmapWirePopoverEditor'

export type MindmapWireState = {
	open: boolean
	position: { x: number; y: number }
	onClose: () => void
	mode: 'doubleClick' | 'contextMenu'
}

export function MindmapWirePopover({ open, position, onClose }: MindmapWireState) {
	const { wires } = useMindmapData()

	const [updateMindmapWire] = useUpdateMindmapWire()
	const [deleteMindmapWires] = useDeleteMindmapWires()
	const selectedWires = useSelector(getSelectedWireKeys)

	const currentWire = useMemo(() => {
		return selectedWires.length > 0 ? wires.find((wire) => wire.id === selectedWires[0]) : undefined
	}, [selectedWires, wires])

	const [label, setLabel] = useState(currentWire?.content ?? '')
	const [direction, setDirection] = useState<MindmapWireDirection>(currentWire?.direction ?? 'Normal')

	const handleClose = useCallback(() => {
		if (currentWire && (label !== currentWire.content || direction !== currentWire.direction)) {
			updateMindmapWire(currentWire.id, {
				content: label,
				direction: direction,
			})
		}
		onClose()
	}, [currentWire, direction, label, onClose, updateMindmapWire])

	useShortcut([Shortcut.Enter, Shortcut.CtrlEnter], handleClose, open && ShortcutPriorities.InputField)

	return (
		<Popover
			open={open}
			onClose={handleClose}
			sx={{
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
				<MindmapWirePopoverEditor
					currentWire={currentWire}
					label={label}
					setLabel={setLabel}
					direction={direction}
					setDirection={setDirection}
				/>
			)}
			{currentWire && <Divider />}
			<MenuList sx={{ minWidth: 200 }}>
				<MenuItem
					color="error"
					onClick={() => {
						deleteMindmapWires(selectedWires)
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
