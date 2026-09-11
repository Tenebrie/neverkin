import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import { useSearch } from '@tanstack/react-router'
import { memo, useRef, useState } from 'react'

import { useEventBusDispatch } from '@/app/features/eventBus'
import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { useEffectOnce } from '@/app/hooks/useEffectOnce'

import { TimelineAnchor } from './anchor/TimelineAnchor'
import { useTimelineContextMenu } from './components/TimelineContextMenu/hooks/useTimelineContextMenu'
import { TimelineControls } from './components/TimelineControls'
import { TimelineEventListener } from './components/TimelineEventListener'
import { TimelineHotkeys } from './components/TimelineHotkeys'
import { TimelineNavigationReporter } from './components/TimelineNavigationReporter'
import { TimelinePrePositioner } from './components/TimelinePrePositioner'
import { TimelineScaleLabel } from './components/TimelineScaleLabel/TimelineScaleLabel'
import { TimelineSelectionBox } from './components/TimelineSelectionBox'
import { TimeMarker } from './components/TimeMarker/TimeMarker'
import { useTimelineDimensions } from './hooks/useTimelineDimensions'
import { TimelineContainer, TimelineWrapper } from './styles'
import { TimelineTracks } from './tracks/TimelineTracks'

export const Timeline = memo(TimelineComponent)

function TimelineComponent() {
	const selectedTime = useSearch({
		from: '/world/$worldId/_world',
		select: (search) => search.time,
	})

	const theme = useCustomTheme()

	const ref = useRef<HTMLDivElement | null>(null)
	const [opacity, setOpacity] = useState(0)
	const { onContextMenu } = useTimelineContextMenu()
	const { containerRef, containerWidth } = useTimelineDimensions()

	const scrollTimelineTo = useEventBusDispatch['timeline/requestScrollTo']()

	useEffectOnce(() => {
		scrollTimelineTo({ timestamp: selectedTime, skipAnim: true })
	})

	return (
		<Paper
			ref={ref}
			sx={{ height: '100%', borderRadius: 0, zIndex: 2, pointerEvents: 'auto', background: 'transparent' }}
		>
			<TimelineWrapper>
				<TimelineContainer
					ref={containerRef}
					onContextMenu={(e) => e.preventDefault()}
					onMouseUp={onContextMenu}
					$theme={theme}
				>
					<Box
						width={1}
						height={1}
						style={{ opacity }}
						sx={{ transition: 'opacity 0.3s' }}
						className="allow-timeline-click"
					>
						{opacity > 0 && (
							<>
								<TimeMarker timestamp={selectedTime} />
								<TimelineTracks containerWidth={containerWidth} />
								<TimelineScaleLabel />
								<TimelineSelectionBox containerRef={containerRef} />
							</>
						)}
					</Box>
				</TimelineContainer>
				<TimelineControls />
			</TimelineWrapper>
			<Box style={{ opacity }} sx={{ transition: 'opacity 0.3s' }}>
				{opacity > 0 && <TimelineAnchor containerWidth={containerWidth} showCurrentTime />}
			</Box>

			<TimelineEventListener containerWidth={containerWidth} />
			<TimelinePrePositioner setOpacity={setOpacity} />
			<TimelineNavigationReporter ref={containerRef} containerWidth={containerWidth} />
			<TimelineHotkeys />
		</Paper>
	)
}
