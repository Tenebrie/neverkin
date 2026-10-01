import { useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { announcementListApi } from '@/api/announcementListApi'
import { calendarApi } from '@/api/calendarApi'
import { useWikiApiCache } from '@/api/hooks/useWikiApiCache'
import { imageGenerationApi } from '@/api/imageGenerationApi'
import { mindmapApi } from '@/api/mindmapApi'
import { FeatureFlag } from '@/api/types/otherTypes'
import { WorldTag } from '@/api/types/worldTypes'
import { WikiArticle, WikiPositionUpdate } from '@/api/types/worldWikiTypes'
import { GetWorldInfoApiResponse, worldDetailsApi } from '@/api/worldDetailsApi'
import { worldEventTracksApi } from '@/api/worldEventTracksApi'
import { worldListApi } from '@/api/worldListApi'
import { worldTagApi } from '@/api/worldTagApi'
import { worldWikiApi } from '@/api/worldWikiApi'
import { worldWikiFolderApi } from '@/api/worldWikiFolderApi'
import { useAutoRef } from '@/app/hooks/useAutoRef'
import { ingestActor, ingestEvent } from '@/app/utils/ingestEntity'
import { worldSlice } from '@/app/views/world/WorldSlice'
import { getWorldState } from '@/app/views/world/WorldSliceSelectors'
import {
	CalliopeToClientMessageHandler,
	CalliopeToClientMessageType,
} from '@/ts-shared/CalliopeToClientMessage'

import { authSlice } from '../../auth/AuthSlice'
import { useEventBusDispatch } from '../../eventBus'

export const useLiveMessageHandlers = () => {
	const { updatedAt: currentUpdatedAt } = useSelector(getWorldState, (a, b) => a.updatedAt === b.updatedAt)
	const { updateUser } = authSlice.actions
	const { updateEvent, updateActor, updateTag } = worldSlice.actions
	const dispatch = useDispatch()

	const { upsertCachedArticle, applyPositionUpdates } = useWikiApiCache()

	const updatedAtRef = useAutoRef(currentUpdatedAt)

	const notifyAboutDocumentReset = useEventBusDispatch['calliope/documentReset']()
	const notifyAboutAnnouncement = useEventBusDispatch['calliope/announcementReceived']()

	const messageHandlers: CalliopeToClientMessageHandler = {
		[CalliopeToClientMessageType.ANNOUNCEMENT]: () => {
			dispatch(announcementListApi.util.invalidateTags(['announcementList']))
			notifyAboutAnnouncement()
		},
		[CalliopeToClientMessageType.IMAGE_GENERATION_UPDATED]: () => {
			dispatch(imageGenerationApi.util.invalidateTags(['imageGeneration']))
		},

		[CalliopeToClientMessageType.WORLD_UPDATED]: (data) => {
			if (new Date(updatedAtRef.current) < new Date(data.timestamp)) {
				dispatch(worldDetailsApi.util.invalidateTags(['worldDetails']))
			}
		},
		[CalliopeToClientMessageType.WORLD_EVENTS_DELETED]: () => {
			dispatch(worldDetailsApi.util.invalidateTags(['worldDetails']))
		},

		[CalliopeToClientMessageType.WORLD_TRACKS_UPDATED]: () => {
			dispatch(worldEventTracksApi.util.invalidateTags(['worldEventTracks']))
		},
		[CalliopeToClientMessageType.WORLD_SHARED]: () => {
			dispatch(worldListApi.util.invalidateTags(['worldList']))
		},
		[CalliopeToClientMessageType.WORLD_UNSHARED]: () => {
			dispatch(worldListApi.util.invalidateTags(['worldList']))
		},
		[CalliopeToClientMessageType.WORLD_EVENT_UPDATED]: (data) => {
			const event = ingestEvent(JSON.parse(data.event) as GetWorldInfoApiResponse['events'][number])
			dispatch(updateEvent(event))
		},
		[CalliopeToClientMessageType.WORLD_EVENT_DELTA_UPDATED]: () => {
			// nothing
		},

		[CalliopeToClientMessageType.ACTOR_UPDATED]: (data) => {
			const actor = ingestActor(JSON.parse(data.actor) as GetWorldInfoApiResponse['actors'][number])
			dispatch(updateActor(actor))
		},
		[CalliopeToClientMessageType.ACTORS_DELETED]: () => {
			dispatch(worldDetailsApi.util.invalidateTags(['worldDetails']))
		},

		[CalliopeToClientMessageType.CALENDAR_UPDATED]: () => {
			dispatch(calendarApi.util.invalidateTags(['calendar']))
		},

		[CalliopeToClientMessageType.MINDMAP_NODES_UPDATED]: (_) => {
			dispatch(mindmapApi.util.invalidateTags(['mindmapNode']))
		},
		[CalliopeToClientMessageType.MINDMAP_NODES_DELETED]: (_) => {
			dispatch(mindmapApi.util.invalidateTags(['mindmapNode']))
		},
		[CalliopeToClientMessageType.MINDMAP_WIRES_CREATED]: (_) => {
			dispatch(mindmapApi.util.invalidateTags(['mindmapWire']))
		},
		[CalliopeToClientMessageType.MINDMAP_WIRE_UPDATED]: (_) => {
			dispatch(mindmapApi.util.invalidateTags(['mindmapWire']))
		},
		[CalliopeToClientMessageType.MINDMAP_WIRES_DELETED]: (_) => {
			dispatch(mindmapApi.util.invalidateTags(['mindmapWire']))
		},

		[CalliopeToClientMessageType.TAG_UPDATED]: (data) => {
			dispatch(updateTag(JSON.parse(data.tag) as WorldTag))
			dispatch(worldTagApi.util.invalidateTags(['worldTag']))
		},
		[CalliopeToClientMessageType.TAGS_DELETED]: () => {
			dispatch(worldTagApi.util.invalidateTags(['worldTag']))
		},

		[CalliopeToClientMessageType.WIKI_ARTICLE_UPDATED]: (data) => {
			const article = JSON.parse(data.article) as WikiArticle
			upsertCachedArticle(article)
		},
		[CalliopeToClientMessageType.WIKI_ARTICLE_DELETED]: () => {
			dispatch(worldWikiApi.util.invalidateTags(['worldWiki']))
		},

		[CalliopeToClientMessageType.WIKI_FOLDER_UPDATED]: () => {
			dispatch(worldWikiFolderApi.util.invalidateTags(['worldWikiFolder']))
		},
		[CalliopeToClientMessageType.WIKI_FOLDER_DELETED]: () => {
			dispatch(worldWikiFolderApi.util.invalidateTags(['worldWikiFolder']))
		},

		[CalliopeToClientMessageType.WIKI_ORDER_CHANGED]: (data) => {
			applyPositionUpdates(JSON.parse(data.updates) as WikiPositionUpdate[])
		},

		[CalliopeToClientMessageType.DOCUMENT_RESET]: (data) => {
			notifyAboutDocumentReset(data)
		},
		[CalliopeToClientMessageType.FEATURE_FLAGS_CHANGED]: (data) => {
			dispatch(updateUser({ featureFlags: data.flags as FeatureFlag[] }))
		},
	}

	const currentHandlersRef = useRef(messageHandlers)
	currentHandlersRef.current = messageHandlers
	return currentHandlersRef
}
