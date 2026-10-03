import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { memo, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useEventBusDispatch } from '@/app/features/eventBus'
import { useModal } from '@/app/features/modals/ModalsSlice'
import { useWorldTime } from '@/app/features/time/hooks/useWorldTime'
import { worldSlice } from '@/app/views/world/WorldSlice'
import {
	getSelectedMarkerKeys,
	getTimelineContextMenuState,
	getTimelineState,
	getWorldState,
} from '@/app/views/world/WorldSliceSelectors'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { useTimelineContextMenuRequests } from './hooks/useTimelineContextMenuRequests'

export const TimelineContextMenuComponent = () => {
	const { timeToLabel } = useWorldTime()
	const { id: worldId } = useSelector(getWorldState, (a, b) => a.id === b.id)
	const selectedMarkerIds = useSelector(getSelectedMarkerKeys)
	const { markers } = useSelector(getTimelineState, (a, b) => a.markers === b.markers)

	const { clearSelections } = worldSlice.actions
	const {
		isOpen,
		selectedTime,
		selectedEvent: targetedMarker,
		mousePos,
	} = useSelector(getTimelineContextMenuState)

	const selectedMarker = useMemo(
		() =>
			selectedMarkerIds.length === 1
				? (markers.find((marker) => marker.key === selectedMarkerIds[0]) ?? null)
				: null,
		[markers, selectedMarkerIds],
	)

	const navigate = useStableNavigate({ from: '/world/$worldId/timeline' })
	const scrollTimelineTo = useEventBusDispatch['timeline/requestScrollTo']()

	const { revokeEventAt, unrevokeEventAt, isRequestInFlight } = useTimelineContextMenuRequests()

	const dispatch = useDispatch()
	const { closeTimelineContextMenu } = worldSlice.actions
	const { open: openDeleteEventModal } = useModal('deleteEventModal')

	const onClose = useCallback(
		() => dispatch(closeTimelineContextMenu()),
		[closeTimelineContextMenu, dispatch],
	)

	const onCreateEvent = useCallback(() => {
		onClose()
		navigate({
			to: '/world/$worldId/timeline',
			search: (prev) => ({ ...prev, time: selectedTime, new: 'event', navi: [] }),
		})
		scrollTimelineTo({ timestamp: selectedTime })
	}, [onClose, navigate, scrollTimelineTo, selectedTime])

	const onResolveSelectedEvent = useCallback(async () => {
		if (!selectedMarker) {
			return
		}

		await revokeEventAt({
			worldId,
			eventId: selectedMarker.eventId,
			revokedAt: Math.max(selectedTime, selectedMarker.markerPosition + 1),
		})

		onClose()
	}, [onClose, revokeEventAt, selectedMarker, selectedTime, worldId])

	const onUnrevokeSelectedEvent = useCallback(async () => {
		if (!targetedMarker) {
			return
		}

		await unrevokeEventAt({
			worldId,
			eventId: targetedMarker.eventId,
		})

		onClose()
	}, [onClose, targetedMarker, unrevokeEventAt, worldId])

	const onDeleteSelectedEvent = useCallback(() => {
		onClose()

		if (!targetedMarker) {
			return
		}

		openDeleteEventModal({ target: targetedMarker })
	}, [onClose, openDeleteEventModal, targetedMarker])

	const onUnselectAll = useCallback(() => {
		dispatch(clearSelections())
		navigate({
			search: (prev) => ({ ...prev, navi: [] }),
		})
		onClose()
	}, [clearSelections, dispatch, navigate, onClose])

	return (
		<Menu
			open={isOpen}
			onClose={onClose}
			defaultValue={undefined}
			MenuListProps={{ sx: { minWidth: 250 } }}
			anchorReference="anchorPosition"
			anchorPosition={{ top: mousePos.y, left: mousePos.x }}
		>
			{/* Click on marker */}
			{targetedMarker && (
				<MenuItem disabled>
					<ListItemText
						primary={
							targetedMarker.markerType === 'deltaState'
								? 'Data point'
								: targetedMarker.markerType === 'issuedAt'
									? 'Event'
									: 'Event resolution'
						}
					/>
				</MenuItem>
			)}
			{targetedMarker && <Divider />}
			{targetedMarker?.markerType === 'revokedAt' && (
				<MenuItem onClick={onUnrevokeSelectedEvent} disabled={isRequestInFlight}>
					<ListItemText primary="Remove event end time" />
					{isRequestInFlight && (
						<ListItemIcon>
							<CircularProgress size={20} />
						</ListItemIcon>
					)}
				</MenuItem>
			)}
			{targetedMarker?.markerType === 'issuedAt' && (
				<MenuItem onClick={onDeleteSelectedEvent}>
					<ListItemText primary="Delete this event" />
				</MenuItem>
			)}
			{targetedMarker?.markerType === 'deltaState' && (
				<MenuItem onClick={onDeleteSelectedEvent}>
					<ListItemText primary="Delete this data point" />
				</MenuItem>
			)}

			{/* Click on timeline with exactly one selected */}
			{!targetedMarker && selectedMarker && (
				<MenuItem disabled>
					<ListItemText
						primary={
							selectedMarker.markerType === 'deltaState'
								? 'Data point'
								: selectedMarker.markerType === 'issuedAt'
									? 'Event'
									: 'Event resolution'
						}
					/>
				</MenuItem>
			)}
			{!targetedMarker && selectedMarker && <Divider />}
			{/* {!targetedMarker && selectedMarker && selectedMarker.markerType !== 'revokedAt' && (
				<MenuItem onClick={onReplaceSelectedEvent}>
					<ListItemText primary="Create data point" />
				</MenuItem>
			)} */}
			{!targetedMarker && selectedMarker && (
				<MenuItem onClick={onResolveSelectedEvent}>
					<ListItemText primary="Resolve event" />
				</MenuItem>
			)}
			{!targetedMarker && selectedMarker && <Divider />}

			{/* Click on timeline with at least one selected */}
			{!targetedMarker && selectedMarkerIds.length > 0 && (
				<MenuItem onClick={onUnselectAll}>
					<ListItemText primary="Unselect all" />
				</MenuItem>
			)}
			{!targetedMarker && selectedMarkerIds.length > 0 && <Divider />}

			{/* Click on timeline */}
			{!targetedMarker && (
				<MenuItem disabled>
					<ListItemText primary={timeToLabel(selectedTime)} />
				</MenuItem>
			)}
			{!targetedMarker && <Divider />}
			{!targetedMarker && (
				<MenuItem onClick={onCreateEvent}>
					<ListItemText primary="Create event" />
				</MenuItem>
			)}
		</Menu>
	)
}

export const TimelineContextMenu = memo(TimelineContextMenuComponent)
