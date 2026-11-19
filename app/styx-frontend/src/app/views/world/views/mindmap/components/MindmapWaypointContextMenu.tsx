import CallSplit from '@mui/icons-material/CallSplit'
import Delete from '@mui/icons-material/Delete'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useState } from 'react'

import { useEventBusSubscribe } from '@/app/features/eventBus'
import { pluralize } from '@/app/utils/pluralize'

import { useMindmapContext, useMindmapSelectionContext } from '../context/useMindmapContext'
import { WaypointSelectionEntry } from '../types'

export function MindmapWaypointContextMenu() {
	const [open, setOpen] = useState(false)
	const [position, setPosition] = useState({ x: 0, y: 0 })
	const [stack, setStack] = useState<WaypointSelectionEntry[]>([])
	const [selectedInStack, setSelectedInStack] = useState<WaypointSelectionEntry[]>([])
	const { deleteWaypoints } = useMindmapContext()
	const { selectedWires } = useMindmapSelectionContext()

	useEventBusSubscribe['mindmap/waypoint/requestOpenContextMenu']({
		callback: (params) => {
			setOpen(true)
			setPosition(params.position)
			setStack(params.stack)
			setSelectedInStack(params.stack.filter((entry) => selectedWires.has(entry.wireId)))
		},
	})

	const remove = (entries: WaypointSelectionEntry[]) => {
		deleteWaypoints(entries.map((entry) => entry.waypointId))
		setOpen(false)
	}

	const isBundle = stack.length > 1
	const isPartOfBundleSelected = selectedInStack.length > 0 && selectedInStack.length < stack.length

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
			{isPartOfBundleSelected && (
				<MenuItem onClick={() => remove(selectedInStack)}>
					<ListItemIcon>
						<CallSplit />
					</ListItemIcon>
					<ListItemText>
						{selectedInStack.length === 1
							? 'Remove link from bundle'
							: `Remove ${pluralize(selectedInStack.length, 'link')} from bundle`}
					</ListItemText>
				</MenuItem>
			)}
			<MenuItem onClick={() => remove(stack)}>
				<ListItemIcon>
					<Delete />
				</ListItemIcon>
				<ListItemText>{isBundle ? `Unbundle ${pluralize(stack.length, 'link')}` : 'Delete pin'}</ListItemText>
			</MenuItem>
		</Menu>
	)
}
