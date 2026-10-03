import { CalendarDraftUnit, CalendarDraftUnitChildRelation } from '@/api/types/calendarTypes'
import { MarkerType, TimelineEntity } from '@/api/types/worldTypes'
import { BoxedWikiEntity } from '@/app/views/world/views/wiki/hooks/useBoxedWikiContent'

import { TimelineTrack } from '../../views/world/views/timeline/hooks/useEventTracks'

export type DraggableParams = {
	['timelineEvent']: {
		event: TimelineEntity<MarkerType>
	}
	['timelineTrack']: {
		track: TimelineTrack
	}
	['articleListItem']: {
		article: BoxedWikiEntity
	}
	['calendarUnit']: {
		unit: CalendarDraftUnit
	}
	['calendarUnitChild']: {
		parentUnitId: string
		child: CalendarDraftUnitChildRelation
		index: number
	}
	['mindmapNodeLinking']: {
		sourceNodeId: string
	}
}

export type AllowedDraggableType = keyof DraggableParams
