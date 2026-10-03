import { ListCalendarTemplatesApiResponse } from '@/api/otherApi'
import { GetWorldInfoApiResponse } from '@/api/worldDetailsApi'
import { GetWorldsApiResponse } from '@/api/worldListApi'
import { MoveWikiEntityApiResponse } from '@/api/worldWikiApi'

export type WikiEntityType = MoveWikiEntityApiResponse['updates'][number]['entityType']
export type FullMentionDetails = GetWorldInfoApiResponse['actors'][number]['mentions'][number]
export type MentionedEntity = GetWorldInfoApiResponse['actors'][number]['mentions'][number]['targetType']
export type MentionDetails = Pick<FullMentionDetails, 'targetId' | 'targetType'>
export type Actor = ActorDetails
export type ActorDetails = GetWorldInfoApiResponse['actors'][number]
export type WorldItem = GetWorldsApiResponse['ownedWorlds'][number]
export type WorldBrief =
	| GetWorldsApiResponse['ownedWorlds'][number]
	| GetWorldsApiResponse['contributableWorlds'][number]
	| GetWorldsApiResponse['visibleWorlds'][number]
export type WorldDetails = Omit<GetWorldInfoApiResponse, 'events' | 'calendars' | 'timeOrigin'> & {
	events: WorldEvent[]
	calendars: WorldCalendar[]
	timeOrigin: number
}
export type WorldEvent = Omit<
	GetWorldInfoApiResponse['events'][number],
	'timestamp' | 'revokedAt' | 'deltaStates'
> & {
	timestamp: number
	revokedAt?: number
}
export type WorldEventDelta = GetWorldInfoApiResponse['events'][number]['deltaStates'][number]
export type WorldCalendar = Omit<GetWorldInfoApiResponse['calendars'][number], 'originTime'> & {
	originTime: number
}
export type WorldCalendarUnit = WorldCalendar['units'][number]
export type WorldCalendarPresentation = WorldCalendar['presentations'][number]
export type WorldCalendarPresentationUnit = WorldCalendar['presentations'][number]['units'][number]

export type WorldTag = GetWorldInfoApiResponse['tags'][number]

export type MarkerType = 'issuedAt' | 'deltaState' | 'revokedAt' | 'ghostEvent' | 'ghostDelta'
/**
 * id: ID of the object this marker represents
 * 	- issuedAt: ID of the event
 *  - revokedAt: ID of the event
 *  - deltaState: ID of the delta
 * eventId: Always ID of the corresponding event
 * key: Unique ID of the marker
 *  - (e.g. `1111-revoked`)
 */
export type TimelineEntity<T extends MarkerType> = WorldEvent & {
	eventId: string
	key: string
	markerPosition: number
	markerType: T
	markerHeight: number
	baseEntity: T extends 'issuedAt'
		? WorldEvent
		: T extends 'revokedAt'
			? WorldEvent
			: T extends 'deltaState'
				? WorldEventDelta
				: null
	chainEntity: TimelineEntity<MarkerType> | null
	followingEntity: TimelineEntity<MarkerType> | null
}

export type WorldAccessMode = WorldBrief['accessMode']
export type CalendarTemplateId = ListCalendarTemplatesApiResponse['keys'][number]
