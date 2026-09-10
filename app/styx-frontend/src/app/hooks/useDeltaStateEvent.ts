import { useSelector } from 'react-redux'

import { mockEventModel } from '@/api/mock/rheaModels.mock'

import { WorldEventDelta } from '../../api/types/worldTypes'
import { getWorldState } from '../views/world/WorldSliceSelectors'

export const useDeltaStateEvent = (delta: WorldEventDelta) => {
	const { events } = useSelector(getWorldState)
	const event = events.find((event) => event.id === delta.worldEventId)
	if (!event) {
		return mockEventModel()
	}
	return event
}
