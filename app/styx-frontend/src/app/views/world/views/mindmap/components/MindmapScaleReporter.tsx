import { dispatchGlobalEvent, useEventBusSubscribe } from '@/app/features/eventBus'
import { useDebounce } from '@/app/hooks/useDebounce'

import { MindmapState } from '../MindmapState'

export function MindmapScaleReporter() {
	const commitScale = useDebounce(() => {
		dispatchGlobalEvent['mindmap/scale/commit']({ scale: MindmapState.scale })
	}, 25)

	useEventBusSubscribe['mindmap/scale/changed']({
		callback: commitScale,
	})
	return null
}
