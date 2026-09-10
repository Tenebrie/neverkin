import throttle from 'lodash.throttle'
import { memo, useMemo } from 'react'

import { useEventBusSubscribe } from '@/app/features/eventBus'
import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { useEffectOnce } from '@/app/hooks/useEffectOnce'

import { TimelineState } from '../utils/TimelineState'
import { anchorSlotIds, useAnchorLines } from './hooks/useAnchorLines'
import { TimelineAnchorLinesItem } from './TimelineAnchorLinesItem'

export const TimelineAnchorPadding = 250 // pixels

type Props = {
	containerWidth: number
}

export const TimelineAnchorLines = memo(TimelineAnchorLinesComponent)

function TimelineAnchorLinesComponent({ containerWidth }: Props) {
	const theme = useCustomTheme()

	const { regenerateDividers, updateDividers } = useAnchorLines({
		containerWidth,
	})

	const updateDividersThrottled = useMemo(() => {
		return throttle((scroll: number) => {
			updateDividers(scroll)
		}, 100)
	}, [updateDividers])

	useEventBusSubscribe['timeline/onScroll']({
		callback: (scroll) => {
			updateDividersThrottled(scroll)
		},
	})

	useEffectOnce(() => {
		regenerateDividers(TimelineState.scroll)
	})

	return (
		<>
			{anchorSlotIds.map((slotId) => (
				<TimelineAnchorLinesItem key={slotId} slotId={slotId} theme={theme} containerWidth={containerWidth} />
			))}
		</>
	)
}
