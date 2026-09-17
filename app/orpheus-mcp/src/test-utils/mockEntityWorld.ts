import { mockNumericCalendar } from './mockCalendar.js'

export const mockEntityWorld = {
	id: 'world-456',
	name: 'Test World',
	isReadOnly: false,
	calendars: [mockNumericCalendar()],
	actors: [
		{
			id: 'a1',
			name: 'Gandalf',
			title: 'The Grey',
			color: '#bf8a40',
			contentRich: 'A wizard',
			updatedAt: '2026-01-03T00:00:00.000Z',
			pages: [{ id: 'p1', name: 'Knowledge' }],
			mentions: [],
			mentionedIn: [{ sourceId: 'e1' }],
		},
		{
			id: 'a2',
			name: 'Phoenix',
			title: '',
			color: '',
			contentRich: '',
			updatedAt: '2026-01-01T00:00:00.000Z',
			pages: [],
			mentions: [],
			mentionedIn: [],
		},
	],
	events: [
		{
			id: 'e1',
			name: 'Dragon Attack',
			timestamp: '1440',
			color: '#ff0000',
			contentRich: 'A dragon attacked',
			updatedAt: '2026-01-04T00:00:00.000Z',
			pages: [{ id: 'ep1', name: 'Aftermath' }],
			mentions: [{ targetId: 'a1' }],
			mentionedIn: [],
		},
	],
	tags: [],
}

export const mockEntityArticles = [
	{
		id: 'art-1',
		name: 'Magic System',
		color: '#00ff00',
		contentRich: 'Elemental forces',
		updatedAt: '2026-01-05T00:00:00.000Z',
		pages: [],
		mentions: [],
		mentionedIn: [],
	},
	{
		id: 'art-2',
		name: 'Phoenix',
		color: '',
		contentRich: '',
		updatedAt: '2026-01-02T00:00:00.000Z',
		pages: [{ id: 'ap1', name: 'Rebirth' }],
		mentions: [],
		mentionedIn: [],
	},
]

export const gandalfMention =
	'<span data-component-props="{&quot;actor&quot;:&quot;a1&quot;}" data-type="mention" data-name="Gandalf"></span>'
