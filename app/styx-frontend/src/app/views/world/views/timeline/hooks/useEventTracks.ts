import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { WorldEventTrack } from '@/api/types/worldEventTracksTypes'
import { MarkerType, TimelineEntity, WorldEvent, WorldEventDelta } from '@/api/types/worldTypes'
import { asMarkerType } from '@/app/utils/asMarkerType'
import { findStartingFrom } from '@/app/utils/findStartingFrom'
import { isNotNull } from '@/app/utils/isNotNull'
import { useListEventTracks } from '@/app/views/world/api/useListEventTracks'
import { getEventCreatorState, getWorldState } from '@/app/views/world/WorldSliceSelectors'

export type TimelineTrack = {
	events: TimelineEntity<MarkerType>[]
	id: string | 'default'
	name: string
	position: number
	baseModel: WorldEventTrack | null
	visible: boolean
	height: number
}
export const TimelineEventHeightPx = 40

type Props = {
	showHidden?: boolean
}

const useEventTracks = ({ showHidden }: Props = {}): {
	tracks: TimelineTrack[]
	allTracks: TimelineTrack[]
	isLoading: boolean
} => {
	const { events } = useSelector(getWorldState, (a, b) => a.events === b.events)
	const { ghost: eventGhost } = useSelector(getEventCreatorState, (a, b) => a.ghost === b.ghost)

	const isEventCreator = false

	const eventGroups = useMemo<TimelineEntity<MarkerType>[]>(() => {
		const sortedEvents = events
			.map((event) => ({
				...event,
				eventId: event.id,
				key: `issuedAt-${event.id}`,
				markerPosition: event.timestamp,
				markerType: asMarkerType('issuedAt'),
				markerHeight: 0,
				baseEntity: event as WorldEvent | WorldEventDelta | null,
				chainEntity: null,
				followingEntity: null,
			}))
			.concat(
				events
					.filter((event) => isNotNull(event.revokedAt))
					.map((event) => ({
						...event,
						eventId: event.id,
						key: `revokedAt-${event.id}`,
						markerPosition: event.revokedAt!,
						markerType: asMarkerType('revokedAt'),
						markerHeight: 0,
						baseEntity: event,
						chainEntity: null,
						followingEntity: null,
					})),
			)
			.sort((a, b) => a.markerPosition - b.markerPosition)

		const findChainedEntity = (event: (typeof sortedEvents)[number], index: number) => {
			if (event.markerType === 'issuedAt' && isNotNull(event.revokedAt)) {
				return sortedEvents.find((e) => e.eventId === event.eventId && e.markerType === 'revokedAt') ?? null
			}
			if (event.markerType === 'deltaState') {
				const nextDelta =
					findStartingFrom(
						sortedEvents,
						index + 1,
						(e) => e.eventId === event.eventId && e.markerType === 'deltaState',
					) ?? null
				if (nextDelta) {
					return nextDelta
				}
				if (isNotNull(event.revokedAt)) {
					return sortedEvents.find((e) => e.eventId === event.eventId && e.markerType === 'revokedAt') ?? null
				}
			}
			return null
		}

		const chainedEvents = sortedEvents.map((event, index) => ({
			...event,
			chainEntity: findChainedEntity(event, index),
		}))

		if (eventGhost && isEventCreator) {
			chainedEvents.push({
				...eventGhost,
				eventId: eventGhost.id,
				key: `ghostEvent-${eventGhost.id}`,
				markerType: asMarkerType('ghostEvent'),
				markerPosition: eventGhost.timestamp,
				markerHeight: 0,
				baseEntity: null,
				chainEntity: null,
				followingEntity: null,
			})
		}

		return chainedEvents
	}, [events, eventGhost, isEventCreator])

	const { data: tracks, isLoading } = useListEventTracks()
	const validTrackIds = useMemo(() => new Set(tracks?.map((t) => t.id)), [tracks])
	const tracksWithEvents = useMemo(
		() =>
			(tracks ?? [])
				.map((track) => ({
					id: track.id as string | 'default',
					name: track.name,
					position: track.position,
					baseModel: track as WorldEventTrack | null,
					visible: track.visible,
					height: 0,
				}))
				.concat([
					{
						id: 'default',
						name: 'Unassigned',
						position: -Infinity,
						baseModel: null,
						visible: true,
						height: 0,
					},
				])
				.sort((a, b) => a.position - b.position)
				.map((track) => {
					const events = eventGroups.filter(
						(event) =>
							event.worldEventTrackId === track.id ||
							(event.worldEventTrackId &&
								!validTrackIds.has(event.worldEventTrackId) &&
								track.id === 'default') ||
							(event.worldEventTrackId === null && track.id === 'default'),
					)

					return {
						...track,
						events,
					}
				}),
		[eventGroups, tracks, validTrackIds],
	)
	const tracksWithHeights = useMemo(
		(): typeof tracksWithEvents => calculateMarkerHeights(tracksWithEvents),
		[tracksWithEvents],
	)
	const tracksWithFollowers = useMemo(() => {
		const allTracks = injectFollowerData(tracksWithHeights)
		return {
			visible: allTracks.filter((track) => track.visible || showHidden),
			all: allTracks,
		}
	}, [showHidden, tracksWithHeights])
	const finalData = useMemo(
		() => ({
			tracks: tracksWithFollowers.visible,
			allTracks: tracksWithFollowers.all,
			isLoading: isLoading || tracks === undefined,
		}),
		[tracksWithFollowers, isLoading, tracks],
	)
	return finalData
}

const calculateMarkerHeights = (tracks: TimelineTrack[]) => {
	const data: Record<string, TimelineEntity<MarkerType>[]> = {}
	const currentState: TimelineEntity<MarkerType>[] = []

	return tracks.map((track) => {
		const trackEvents = track.events
			.sort((a, b) => a.markerPosition - b.markerPosition)
			.map((event) => {
				const trackId = event.worldEventTrackId ?? 'default'
				const previousEvents =
					data[trackId]?.filter((e) => {
						if (
							e.chainEntity &&
							e.markerPosition <= event.markerPosition &&
							e.chainEntity.markerPosition >= event.markerPosition
						) {
							return true
						}
						if (e.timestamp === event.markerPosition) {
							return true
						}
						return false
					}) ?? []

				if (event.markerType === 'ghostEvent' || event.markerType === 'ghostDelta') {
					return event
				}
				if (event.markerType !== 'issuedAt') {
					const newEvent = {
						...event,
						markerHeight: currentState.find((m) => m.eventId === event.eventId)?.markerHeight ?? 0,
					}
					data[trackId] = previousEvents.concat(newEvent)
					currentState.push(newEvent)
					return newEvent
				}
				const maximumHeight =
					previousEvents.length > 0
						? previousEvents.map((e) => e.markerHeight).sort((a, b) => b - a)[0] + 1
						: 0

				const height = (() => {
					for (let i = 0; i <= maximumHeight; i++) {
						if (!previousEvents.some((e) => e.markerHeight === i)) {
							return i
						}
					}
					return maximumHeight
				})()
				const newEvent = {
					...event,
					markerHeight: height,
				}
				data[trackId] = previousEvents.concat(newEvent)
				currentState.push(newEvent)
				return newEvent
			})

		return {
			...track,
			events: trackEvents,
			height:
				Math.max(2, trackEvents.map((e) => e.markerHeight + 2).sort((a, b) => b - a)[0] ?? 0) *
				TimelineEventHeightPx,
		}
	})
}

const injectFollowerData = (tracks: TimelineTrack[]) => {
	return tracks.map((track) => {
		const sortedEvents = track.events.sort((a, b) => a.markerPosition - b.markerPosition)
		const events = sortedEvents.map((event, index) => ({
			...event,
			followingEntity:
				findStartingFrom(sortedEvents, index + 1, (e) => e.markerHeight === event.markerHeight) ?? null,
		}))
		return {
			...track,
			events: events.sort((a, b) => b.markerPosition - a.markerPosition),
		}
	})
}

export default useEventTracks
