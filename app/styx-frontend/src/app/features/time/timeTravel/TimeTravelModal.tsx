import OpenInNew from '@mui/icons-material/OpenInNew'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useCallback, useEffect, useRef, useState } from 'react'

import { WorldCalendar } from '@/api/types/worldTypes'
import { Shortcut, useShortcut } from '@/app/hooks/useShortcut/useShortcut'
import { useCheckRouteMatch } from '@/router-utils/hooks/useCheckRouteMatch'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'
import Modal, { ModalFooter, ModalHeader, useModalCleanup } from '@/ui-lib/components/Modal'

import { useEventBusDispatch } from '../../eventBus'
import { useModal } from '../../modals/ModalsSlice'
import { getDocsUrl } from '../../navigation/utils/getDocsUrl'
import { useTimeSelector } from '../hooks/useTimeSelector'
import { useWorldTime } from '../hooks/useWorldTime'
import { useMarkerTimeTravel } from './useMarkerTimeTravel'

export const TimeTravelModal = () => {
	const { isOpen, close, startingTime, markers } = useModal('timeTravelModal')
	const navigate = useStableNavigate({ from: '/world/$worldId' })
	const isTimelineView = useCheckRouteMatch('/world/$worldId/timeline')

	const { timeToLabel, calendar } = useWorldTime()
	const { applySelector } = useTimeSelector({ rawTime: startingTime })

	const calendarRef = useRef<WorldCalendar>(null)
	const selectorRef = useRef<HTMLInputElement | null>(null)

	const [timeSelector, setTimeSelector] = useState('')
	const [moveMarkersValue, setMoveMarkersValue] = useState(true)

	const [error, setError] = useState<string | null>(null)

	const [initialTime, setInitialTime] = useState(startingTime)
	const [targetTime, setTargetTime] = useState(startingTime)
	const [displayedTargetTime, setDisplayedTargetTime] = useState('')

	const [moveMarkers] = useMarkerTimeTravel({ markers })

	useEffect(() => {
		if (calendar !== calendarRef.current) {
			setTargetTime(startingTime)
			setDisplayedTargetTime(timeToLabel(startingTime))
		}
		calendarRef.current = calendar
	}, [calendar, startingTime, targetTime, timeToLabel])

	const onSelectorChanged = useCallback(
		(value: string) => {
			setTimeSelector(value)
			const { timestamp } = applySelector(value)
			setTargetTime(timestamp)
			setError(null)

			setDisplayedTargetTime(timeToLabel(timestamp))
		},
		[applySelector, timeToLabel],
	)

	useModalCleanup({
		isOpen,
		onCleanup: () => {
			const { timestamp } = applySelector(timeSelector)
			setTargetTime(timestamp)
			setInitialTime(startingTime)
			setError(null)
			setDisplayedTargetTime(timeToLabel(timestamp))
		},
	})

	const scrollTimelineTo = useEventBusDispatch['timeline/requestScrollTo']()

	const onConfirm = useCallback(() => {
		if (!isOpen) {
			return
		}

		if (markers.length > 0 && moveMarkersValue) {
			const result = moveMarkers(targetTime - initialTime)
			if (result.error) {
				setError(result.error)
				return
			}
		}

		scrollTimelineTo({ timestamp: targetTime })
		navigate({
			search: (prev) => ({
				...prev,
				time: targetTime,
			}),
		})

		close()
	}, [
		isOpen,
		scrollTimelineTo,
		targetTime,
		navigate,
		markers.length,
		moveMarkersValue,
		close,
		moveMarkers,
		initialTime,
	])

	useEffect(() => {
		const interval = window.setInterval(() => {
			if (selectorRef.current && isOpen) {
				selectorRef.current.select()
				window.clearInterval(interval)
			}
		}, 10)
		return () => {
			window.clearInterval(interval)
		}
	}, [isOpen, selectorRef, timeToLabel])

	const { largeLabel: shortcutLabel } = useShortcut(
		[Shortcut.Enter, Shortcut.CtrlEnter],
		() => onConfirm(),
		isOpen ? 1 : -1,
	)

	return (
		<Modal visible={isOpen} onClose={close} closeOnBackdropClick>
			<ModalHeader>Move to time</ModalHeader>
			<TextField
				label="Selector"
				type="text"
				inputRef={selectorRef}
				value={timeSelector}
				onChange={(event) => onSelectorChanged(event.target.value)}
				autoFocus
				helperText={error}
				error={!!error}
				placeholder="I.e. '14:23' or 'March'"
			/>
			<Typography>
				<b>{isTimelineView ? 'Travel to:' : 'Move to:'}</b> {displayedTargetTime}
			</Typography>
			{markers.length > 0 && isTimelineView && (
				<FormControlLabel
					control={
						<Checkbox
							checked={moveMarkersValue}
							onChange={(event) => setMoveMarkersValue(event.target.checked)}
						/>
					}
					label="Move selected markers"
				/>
			)}
			<ModalFooter>
				<Stack direction="row" alignItems="center" justifyContent="space-between" width={1}>
					<Link
						href={getDocsUrl('/features/time-travel')}
						target="_blank"
						rel="noopener noreferrer"
						sx={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 0.5,
							whiteSpace: 'nowrap',
						}}
					>
						Documentation <OpenInNew sx={{ fontSize: 14, opacity: 0.6 }} />
					</Link>
					<Stack direction="row-reverse" justifyContent="space-between" width="100%">
						<Stack direction="row-reverse" spacing={2}>
							<Tooltip title={shortcutLabel} arrow placement="top">
								<Button variant="contained" color="primary" onClick={onConfirm}>
									Confirm
								</Button>
							</Tooltip>
							<Button variant="outlined" onClick={close}>
								Cancel
							</Button>
						</Stack>
					</Stack>
				</Stack>
			</ModalFooter>
		</Modal>
	)
}
