import type { operations } from '@neverkin/openapi-fetch'

import { mockNumericCalendar } from './mockCalendar.js'

type WorldDetails = operations['getWorldInfo']['responses']['200']['content']['application/json']

export type MockWorldEvent = WorldDetails['events'][number]
export type MockWorldActor = WorldDetails['actors'][number]
export type MockWorldTag = WorldDetails['tags'][number]

export function mockWorldEvent(
	overrides: Partial<MockWorldEvent> & { id: string; name: string },
): MockWorldEvent {
	return {
		worldId: 'world-1',
		createdAt: '2024-01-01T00:00:00.000Z',
		updatedAt: '2024-01-01T00:00:00.000Z',
		content: '',
		contentRich: '',
		timestamp: '0',
		icon: '',
		color: '',
		pages: [],
		mentions: [],
		mentionedIn: [],
		parentFolderId: null,
		parentFolderPosition: 0,
		...overrides,
	}
}

export function mockWorldActor(
	overrides: Partial<MockWorldActor> & { id: string; name: string },
): MockWorldActor {
	return {
		worldId: 'world-1',
		createdAt: '2024-01-01T00:00:00.000Z',
		updatedAt: '2024-01-01T00:00:00.000Z',
		content: '',
		contentRich: '',
		title: '',
		icon: '',
		color: '',
		pages: [],
		mentions: [],
		mentionedIn: [],
		parentFolderId: null,
		parentFolderPosition: 0,
		...overrides,
	}
}

export function mockWorldTag(overrides: Partial<MockWorldTag> & { id: string; name: string }): MockWorldTag {
	return {
		worldId: 'world-1',
		createdAt: '2024-01-01T00:00:00.000Z',
		updatedAt: '2024-01-01T00:00:00.000Z',
		description: '',
		mentions: [],
		mentionedIn: [],
		color: '',
		parentFolderId: null,
		parentFolderPosition: 0,
		...overrides,
	}
}

export function mockWorldDetails(overrides: Partial<WorldDetails> = {}): WorldDetails {
	return {
		id: 'world-1',
		name: 'Test World',
		createdAt: '2024-01-01T00:00:00.000Z',
		updatedAt: '2024-01-01T00:00:00.000Z',
		description: '',
		isReadOnly: false,
		accessMode: 'Private',
		ownerId: 'user-1',
		timeOrigin: '0',
		calendars: [mockNumericCalendar() as WorldDetails['calendars'][number]],
		events: [],
		actors: [],
		tags: [],
		...overrides,
	}
}
