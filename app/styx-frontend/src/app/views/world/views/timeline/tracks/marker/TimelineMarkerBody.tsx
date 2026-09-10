import { Icon } from '@iconify/react'
import Close from '@mui/icons-material/Close'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import classNames from 'classnames'
import { CSSProperties, memo, MouseEvent, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { MarkerType, TimelineEntity } from '@/api/types/worldTypes'
import { getTimelinePreferences } from '@/app/features/preferences/PreferencesSliceSelectors'
import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { useWorldTime } from '@/app/features/time/hooks/useWorldTime'
import { useDoubleClick } from '@/app/hooks/useDoubleClick'
import { isMultiselectEvent } from '@/app/utils/isMultiselectClick'
import { worldSlice } from '@/app/views/world/WorldSlice'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { TimelineEventHeightPx } from '../../hooks/useEventTracks'
import { MarkerTooltipSummonable } from '../../utils/MarkerTooltip'
import { HoveredTimelineEvents } from '../components/HoveredTimelineEvents'
import { Marker, MarkerIcon } from './styles'

type Props = {
	entity: TimelineEntity<MarkerType>
	selected: boolean
	trackHeight: number
}

export const TimelineMarkerBody = memo(TimelineMarkerBodyComponent)

export function TimelineMarkerBodyComponent({ entity, selected }: Props) {
	const dispatch = useDispatch()
	const { openTimelineContextMenu, addTimelineMarkerToSelection, removeTimelineMarkerFromSelection } =
		worldSlice.actions
	const { reduceAnimations } = useSelector(
		getTimelinePreferences,
		(a, b) => a.reduceAnimations === b.reduceAnimations,
	)

	const navigate = useStableNavigate({ from: '/world/$worldId/timeline' })

	const { timeToLabel } = useWorldTime()
	const [isHovered, setIsHovered] = useState(false)
	const markerRef = useRef<HTMLDivElement>(null)

	const { triggerClick } = useDoubleClick<{ multiselect: boolean }>({
		onClick: ({ multiselect }) => {
			if (selected) {
				dispatch(removeTimelineMarkerFromSelection(entity.key))
			} else {
				dispatch(addTimelineMarkerToSelection({ ...entity, multiselect }))
			}
		},
		onDoubleClick: ({ multiselect }) => {
			if (entity.markerType === 'ghostEvent' || entity.markerType === 'ghostDelta') {
				return
			}

			navigate({
				search: (prev) => ({
					...prev,
					time: entity.markerPosition,
					navi: [...(multiselect ? prev.navi : []), entity.key],
				}),
			})
			dispatch(addTimelineMarkerToSelection({ ...entity, multiselect }))
		},
		ignoreDelay: true,
	})

	const onClick = (clickEvent: MouseEvent<HTMLDivElement>) => {
		clickEvent.stopPropagation()
		clickEvent.preventDefault()

		triggerClick(clickEvent, { multiselect: isMultiselectEvent(clickEvent) })
	}

	const onContextMenu = (clickEvent: MouseEvent<HTMLDivElement>) => {
		if (clickEvent.shiftKey) {
			return
		}

		clickEvent.stopPropagation()
		clickEvent.preventDefault()

		// Prevent mouseup from closing the menu by stopping event propagation
		const handleMouseUp = (e: globalThis.MouseEvent) => {
			if (e.button === 2) {
				e.stopPropagation()
				e.preventDefault()
			}
			window.removeEventListener('mouseup', handleMouseUp, true)
		}
		window.addEventListener('mouseup', handleMouseUp, true)

		dispatch(
			openTimelineContextMenu({
				selectedEvent: entity,
				mousePos: {
					x: clickEvent.clientX + 1,
					y: clickEvent.clientY,
				},
				selectedTime: entity.markerPosition,
			}),
		)
	}

	const onMouseEnter = () => {
		// Don't show tooltips while selecting with box
		if (window.document.body.classList.contains('mouse-busy')) {
			return
		}
		HoveredTimelineEvents.hoverEvent(entity)
		setIsHovered(true)
	}

	const onMouseLeave = () => {
		HoveredTimelineEvents.unhoverEvent(entity)
		setIsHovered(false)
	}

	const theme = useCustomTheme()

	// Calculate absolute position for the timestamp box (above the marker)
	const getTimestampBoxPosition = () => {
		if (!markerRef.current) {
			return { left: 0, top: 0 }
		}
		const rect = markerRef.current.getBoundingClientRect()
		return {
			left: rect.left + rect.width / 2, // Center horizontally
			top: rect.top, // Position at the top of the marker
		}
	}

	const timestampBoxPosition = getTimestampBoxPosition()

	const cssVariables = {
		'--border-color': entity.color,
		'--marker-size': `${TimelineEventHeightPx - 6}px`,
		'--border-radius': '6px',
	} as CSSProperties

	const [isTooltipRendered, setIsTooltipRendered] = useState(false)
	useEffect(() => {
		if (isHovered) {
			setIsTooltipRendered(true)
		} else {
			const timeout = setTimeout(() => {
				setIsTooltipRendered(false)
			}, 180)
			return () => clearTimeout(timeout)
		}
	}, [isHovered])

	return (
		<Marker
			ref={markerRef}
			style={cssVariables}
			onClick={onClick}
			onContextMenu={onContextMenu}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			$theme={theme}
			className={classNames('block-timeline', {
				selected,
			})}
			data-event-key={entity.key}
			data-event-id={entity.eventId}
		>
			<Icon
				icon={entity.icon === 'default' ? 'mdi:event' : entity.icon}
				color={entity.color}
				style={{
					position: 'absolute',
					top: '0px',
					left: '0px',
					width: '100%',
					height: '100%',
					pointerEvents: 'none',
				}}
			/>
			{entity.markerType === 'revokedAt' && (
				<MarkerIcon className="icon">
					<Close sx={{ width: 'calc(100% - 2px)', height: 'calc(100% - 2px)' }} />
				</MarkerIcon>
			)}
			{isTooltipRendered && (
				<MarkerTooltipSummonable>
					<Paper
						role="tooltip"
						aria-hidden={!isHovered}
						elevation={4}
						sx={{
							position: 'fixed',
							left: `${timestampBoxPosition.left}px`,
							top: `${timestampBoxPosition.top}px`,
							padding: '8px 12px',
							opacity: isHovered ? 1 : 0,
							transition: reduceAnimations ? 'none' : 'opacity 0.15s, transform 0.15s',
							pointerEvents: 'none',
							whiteSpace: 'nowrap',
							zIndex: 10,
							display: 'flex',
							flexDirection: 'column',
							gap: '4px',
							alignItems: 'center',
							transform: isHovered
								? 'translate(-50%, calc(-100% - 8px))'
								: 'translate(-50%, calc(-100% - 4px))',
						}}
					>
						<Typography variant="caption">{timeToLabel(entity.markerPosition)}</Typography>
						<Typography variant="caption" fontWeight={600}>
							{entity.name}
						</Typography>
					</Paper>
				</MarkerTooltipSummonable>
			)}
			<Box
				className="hover-highlight"
				sx={{
					width: 'calc(100% + 4px)',
					height: 'calc(100% + 4px)',
					background: 'rgba(255, 255, 255, 0.0)',
					borderRadius: '6px',
					transition: 'opacity 0.3s, background 0.3s',
					position: 'absolute',
					top: '-2px',
					left: '-2px',
				}}
			/>
			<Box
				className="active-highlight"
				sx={{
					width: 'calc(100% + 4px)',
					height: 'calc(100% + 4px)',
					background: 'rgba(255, 255, 255, 0.0)',
					borderRadius: '6px',
					transition: 'opacity 0.3s, background 0.3s',
					position: 'absolute',
					top: '-2px',
					left: '-2px',
				}}
			/>
			<Box
				className="selection-highlight"
				sx={{
					width: 'calc(100% + 4px)',
					height: 'calc(100% + 4px)',
					background: entity.color,
					opacity: 0,
					borderRadius: '6px',
					transition: 'opacity 0.3s, background 0.3s',
					position: 'absolute',
					filter: 'brightness(2) saturate(5)',
					top: '-2px',
					left: '-2px',
				}}
			/>
		</Marker>
	)
}
