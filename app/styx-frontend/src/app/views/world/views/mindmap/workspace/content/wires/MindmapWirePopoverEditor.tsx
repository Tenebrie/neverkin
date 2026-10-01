import ArrowBack from '@mui/icons-material/ArrowBack'
import ArrowForward from '@mui/icons-material/ArrowForward'
import SwapHoriz from '@mui/icons-material/SwapHoriz'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useEffect } from 'react'

import { MindmapWire, MindmapWireDirection } from '@/api/types/mindmapTypes'
import { MultiSwitch } from '@/ui-lib/components/MultiSwitch/MultiSwitch'

import { useEntityResolver } from '../../../../../modals/editEventModal/hooks/useEntityResolver'

export type MindmapWireState = {
	currentWire: MindmapWire
	label: string
	direction: MindmapWireDirection
	setLabel: (label: string) => void
	setDirection: (direction: MindmapWireDirection) => void
}

export function MindmapWirePopoverEditor({
	currentWire,
	label,
	setLabel,
	direction,
	setDirection,
}: MindmapWireState) {
	const { resolveEntity } = useEntityResolver()

	useEffect(() => {
		setLabel(currentWire?.content ?? '')
		setDirection(currentWire?.direction ?? 'Normal')
	}, [currentWire, setLabel, setDirection])

	const sourceActor = resolveEntity(currentWire.sourceNodeId)
	const targetActor = resolveEntity(currentWire.targetNodeId)

	if (!sourceActor?.node || !targetActor?.node) {
		return null
	}

	const leftActor = (() => {
		if (sourceActor.node.positionX < targetActor.node.positionX) {
			return sourceActor
		} else if (sourceActor.node.positionX > targetActor.node.positionX) {
			return targetActor
		} else if (sourceActor.node.positionY < targetActor.node.positionY) {
			return sourceActor
		}
		return targetActor
	})()

	const rightActor = leftActor === sourceActor ? targetActor : sourceActor
	const isFlipped = leftActor !== sourceActor

	return (
		<>
			<Box sx={{ p: '12px 12px 0 12px', minWidth: 300 }}>
				<TextField
					label="Label"
					size="small"
					variant="outlined"
					fullWidth
					value={label}
					onChange={(e) => setLabel(e.target.value)}
				/>
			</Box>
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				sx={{ px: 2, py: 1.5, gap: 1.5 }}
			>
				<Tooltip title={leftActor.entity.name} disableInteractive placement="top">
					<Typography
						variant="body2"
						sx={{
							flex: 1,
							textAlign: 'right',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
						}}
					>
						{leftActor.entity.name}
					</Typography>
				</Tooltip>
				<MultiSwitch
					value={direction}
					positions={[
						{
							value: isFlipped ? 'Normal' : 'Reversed',
							icon: <ArrowBack />,
						},
						{
							value: 'TwoWay',
							icon: <SwapHoriz />,
						},
						{
							value: isFlipped ? 'Reversed' : 'Normal',
							icon: <ArrowForward />,
						},
					]}
					onChange={setDirection}
				/>
				<Tooltip title={rightActor.entity.name} disableInteractive placement="top">
					<Typography
						variant="body2"
						sx={{
							flex: 1,
							textAlign: 'left',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
						}}
					>
						{rightActor.entity.name}
					</Typography>
				</Tooltip>
			</Stack>
		</>
	)
}
