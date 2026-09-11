import { v4 as getRandomId } from 'uuid'

import { DeepPartial } from '@/app/utils/DeepPartial'

import { User } from '../../app/features/auth/AuthSlice'
import { GetCalendarPreviewApiResponse } from '../calendarApi'
import { CollaboratingUser } from '../types/worldCollaboratorsTypes'
import {
	ActorDetails,
	WorldBrief,
	WorldCalendar,
	WorldDetails,
	WorldEventDelta,
	WorldItem,
} from '../types/worldTypes'
import { WorldEvent } from '../types/worldTypes'
import { GetWorldInfoApiResponse } from '../worldDetailsApi'

export const mockUserModel = (user: Partial<User> = {}): User => ({
	id: getRandomId(),
	email: 'user@localhost',
	username: 'User',
	level: 'Free',
	bio: 'My detailed bio',
	avatarUrl: 'https://http.cat/images/404.jpg',
	featureFlags: [],
	...user,
})

export const mockCollaboratingUser = (data: DeepPartial<CollaboratingUser> = {}): CollaboratingUser => ({
	access: 'Editing',
	worldId: 'world-1111',
	...data,
	user: {
		id: 'user-1111',
		email: 'user@localhost',
		...data?.user,
	},
})

export const mockWorldItemModel = (world: Partial<WorldItem> = {}): WorldItem => ({
	id: getRandomId(),
	name: 'World name',
	description: 'World description',
	calendar: 'EARTH',
	timeOrigin: '0',
	createdAt: new Date(0).toISOString(),
	updatedAt: new Date(0).toISOString(),
	ownerId: '1111-2222-3333-4444',
	collaborators: [],
	accessMode: 'Private',
	calendars: [],
	userPins: [],
	...world,
})

export const mockWorldBriefModel = (world: Partial<WorldBrief> = {}): WorldBrief => ({
	...mockWorldItemModel(),
	...world,
})

export const mockWorldDetailsModel = (world: Partial<WorldDetails> = {}): WorldDetails => ({
	...mockWorldItemModel(),
	events: [],
	actors: [],
	calendars: [],
	timeOrigin: 0,
	tags: [],
	isReadOnly: false,
	...world,
})

export const mockActorModel = (actor: Partial<ActorDetails> = {}): ActorDetails => ({
	id: getRandomId(),
	worldId: 'world-1111-2222-3333-4444',
	name: 'Actor name',
	title: 'Actor title',
	content: 'Actor description',
	contentRich: 'Actor description',
	createdAt: new Date(0).toISOString(),
	updatedAt: new Date(0).toISOString(),
	mentions: [],
	mentionedIn: [],
	icon: 'default',
	color: '#008080',
	pages: [],
	parentFolderId: null,
	parentFolderPosition: 0,
	...actor,
})

export const mockEventModel = (statement: Partial<WorldEvent> = {}): WorldEvent => ({
	id: getRandomId(),
	worldId: 'world-1111-2222-3333-4444',
	name: 'Event name',
	content: 'Event description',
	contentRich: '<p>Event description</p>',
	icon: 'default',
	timestamp: 0,
	createdAt: new Date(0).toISOString(),
	updatedAt: new Date(0).toISOString(),
	mentions: [],
	mentionedIn: [],
	deltaStates: [],
	worldEventTrackId: null,
	color: '#008080',
	pages: [],
	parentFolderId: null,
	parentFolderPosition: 0,
	...statement,
})

export const mockEventDeltaModel = (
	provided: Partial<WorldEventDelta> & Pick<WorldEventDelta, 'worldEventId'>,
): WorldEventDelta => ({
	id: getRandomId(),
	createdAt: new Date(0).toISOString(),
	updatedAt: new Date(0).toISOString(),
	timestamp: 0,
	name: 'Delta name',
	description: 'Delta description',
	descriptionRich: '<p>Delta description</p>',
	...provided,
})

export const mockApiWorldDetailsModel = (
	world: Partial<GetWorldInfoApiResponse> = {},
): GetWorldInfoApiResponse => ({
	id: getRandomId(),
	name: 'World name',
	description: 'World description',
	createdAt: new Date(0).toISOString(),
	updatedAt: new Date(0).toISOString(),
	actors: [],
	events: [],
	tags: [],
	calendar: 'EARTH',
	ownerId: 'user-1111',
	timeOrigin: '0',
	accessMode: 'Private',
	isReadOnly: false,
	calendars: [],
	...world,
})

export const mockApiEventModel = (
	statement: Partial<GetWorldInfoApiResponse['events'][number]> = {},
): GetWorldInfoApiResponse['events'][number] => ({
	id: getRandomId(),
	worldId: 'world-1111-2222-3333-4444',
	name: 'Event name',
	content: 'Event description',
	contentRich: '<p>Event description</p>',
	icon: 'default',
	timestamp: '0',
	createdAt: new Date(0).toISOString(),
	updatedAt: new Date(0).toISOString(),
	mentions: [],
	mentionedIn: [],
	deltaStates: [],
	revokedAt: null,
	worldEventTrackId: null,
	color: '#008080',
	pages: [],
	parentFolderId: null,
	parentFolderPosition: 0,
	...statement,
})

export function mockCalendar(overrides: Partial<WorldCalendar>): WorldCalendar {
	return {
		units: [],
		presentations: [],
		id: getRandomId(),
		updatedAt: '2024-01-01T00:00:00.000Z',
		name: 'Test Calendar',
		description: '',
		position: 0,
		originTime: 0,
		seasons: [],
		...overrides,
	}
}

export const mockCalendarUnit = (
	overrides: Omit<Partial<GetCalendarPreviewApiResponse['units'][number]>, 'duration'> & {
		id: string
		name: string
		duration: number
	},
): GetCalendarPreviewApiResponse['units'][number] => ({
	id: overrides.id,
	position: overrides.position ?? 0,
	name: overrides.name,
	displayName: overrides.displayName ?? overrides.name,
	displayNameShort: overrides.displayNameShort ?? overrides.name.substring(0, 1).toUpperCase(),
	displayNamePlural: overrides.displayNamePlural ?? overrides.name + 's',
	formatMode: overrides.formatMode ?? 'Numeric',
	formatShorthand: overrides.formatShorthand ?? null,
	negativeFormat: overrides.negativeFormat ?? 'MinusSign',
	duration: String(overrides.duration ?? 1),
	treeDepth: overrides.treeDepth ?? 0,
	children: overrides.children ?? [],
	parents: overrides.parents ?? [],
})

export const mockCalendarUnitChildRelation = (
	parentUnitId: string,
	childUnitId: string,
	repeats: number,
	overrides: Partial<GetCalendarPreviewApiResponse['units'][number]['children'][number]> = {},
): GetCalendarPreviewApiResponse['units'][number]['children'][number] => ({
	id: overrides.id ?? `${parentUnitId}-${childUnitId}`,
	calendarId: overrides.calendarId ?? 'calendar-1111',
	position: overrides.position ?? 0,
	label: overrides.label ?? null,
	repeats,
	parentUnitId,
	childUnitId,
})

export const mockCalendarUnitParentRelation = (
	parentUnitId: string,
	childUnitId: string,
	repeats: number,
	overrides: Partial<GetCalendarPreviewApiResponse['units'][number]['parents'][number]> = {},
): GetCalendarPreviewApiResponse['units'][number]['parents'][number] => ({
	id: overrides.id ?? `${parentUnitId}-${childUnitId}`,
	calendarId: overrides.calendarId ?? 'calendar-1111',
	position: overrides.position ?? 0,
	label: overrides.label ?? null,
	repeats,
	parentUnitId,
	childUnitId,
})
