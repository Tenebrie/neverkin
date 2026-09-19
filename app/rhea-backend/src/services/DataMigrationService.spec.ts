import { randomUUID } from 'node:crypto'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prismaMockRef } from '../mock/utils/prismaMock.js'
import { DataMigrationService } from './DataMigrationService.js'

const now = new Date()

const serialize = (data: unknown): string =>
	JSON.stringify(data, (_k, v) => (typeof v === 'bigint' ? v.toString() : v))

type ExportedData = Awaited<ReturnType<typeof DataMigrationService.exportUserData>>
type ExportedWorld = ExportedData['user']['worlds'][number]

const makeMention = (sourceId: string, targetId: string, overrides: Record<string, unknown> = {}) =>
	({
		id: randomUUID(),
		sourceType: 'Actor' as const,
		targetType: 'Event' as const,
		sourceId,
		targetId,
		sourceActorId: sourceId,
		sourceEventId: null,
		sourceArticleId: null,
		sourceTagId: null,
		sourceNodeId: null,
		targetActorId: null,
		targetEventId: targetId,
		targetArticleId: null,
		targetTagId: null,
		pageId: null,
		...overrides,
	}) satisfies ExportedWorld['actors'][number]['mentions'][number]

const makeActor = (
	worldId: string,
	id = 'actor-1',
	mentions: ReturnType<typeof makeMention>[] = [],
	pages: ReturnType<typeof makePage>[] = [],
) =>
	({
		id,
		createdAt: now,
		updatedAt: now,
		name: 'Actor',
		content: '',
		worldId,
		title: '',
		icon: '',
		color: '',
		contentRich: '',
		mentions,
		pages,
		parentFolderId: null,
		parentFolderPosition: 0,
	}) satisfies ExportedWorld['actors'][number]

const makeEvent = (
	worldId: string,
	id = 'event-1',
	mentions: ReturnType<typeof makeMention>[] = [],
	pages: ReturnType<typeof makePage>[] = [],
) =>
	({
		id,
		createdAt: now,
		updatedAt: now,
		name: 'Event',
		content: '',
		worldId,
		icon: '',
		color: '',
		contentRich: '',
		timestamp: BigInt(0),
		revokedAt: null as bigint | null,
		worldEventTrackId: null as string | null,
		mentions,
		pages,
		parentFolderId: null,
		parentFolderPosition: 0,
	}) satisfies ExportedWorld['events'][number]

const makeTag = (worldId: string, id = 'tag-1', mentions: ReturnType<typeof makeMention>[] = []) =>
	({
		id,
		createdAt: now,
		updatedAt: now,
		name: 'Tag',
		description: '',
		color: '',
		worldId,
		mentions,
		parentFolderId: null,
		parentFolderPosition: 0,
	}) satisfies ExportedWorld['tags'][number]

const makeArticle = (
	worldId: string,
	id = 'article-1',
	{
		parentId = null as string | null,
		mentions = [] as ReturnType<typeof makeMention>[],
		pages = [] as ReturnType<typeof makePage>[],
	} = {},
) =>
	({
		id,
		createdAt: now,
		updatedAt: now,
		name: 'Article',
		worldId,
		icon: '',
		color: '',
		content: '',
		contentRich: '',
		mentions,
		pages,
		parentFolderId: parentId,
		parentFolderPosition: 0,
	}) satisfies ExportedWorld['articles'][number]

const makeFolder = (
	worldId: string,
	id = randomUUID() as string,
	overrides: Partial<ExportedWorld['articles'][number]> = {},
) =>
	({
		id,
		createdAt: now,
		updatedAt: now,
		name: 'Article',
		worldId,
		icon: '',
		color: '',
		content: '',
		contentRich: '',
		mentions: [],
		pages: [],
		parentFolderId: null,
		parentFolderPosition: 0,
		...overrides,
	}) satisfies ExportedWorld['articles'][number]

const makePage = (id = 'page-1', overrides: Record<string, unknown> = {}) =>
	({
		id,
		createdAt: now,
		updatedAt: now,
		name: 'Page',
		content: '',
		contentRich: '',
		parentType:
			'parentEventId' in overrides
				? ('Event' as const)
				: 'parentArticleId' in overrides
					? ('Article' as const)
					: ('Actor' as const),
		parentActorId: null as string | null,
		parentEventId: null as string | null,
		parentArticleId: null as string | null,
		parentNodeId: null as string | null,
		...overrides,
	}) satisfies ExportedWorld['articles'][number]['pages'][number]

const makeMindmapNode = (
	worldId: string,
	id = 'node-1',
	links: ReturnType<typeof makeMindmapLink>[] = [],
	mentions: ReturnType<typeof makeMention>[] = [],
	pages: ReturnType<typeof makePage>[] = [],
) =>
	({
		id,
		createdAt: now,
		updatedAt: now,
		name: '',
		content: '',
		contentRich: '',
		worldId,
		positionX: 0,
		positionY: 0,
		parentActorId: null as string | null,
		parentArticleId: null as string | null,
		parentEventId: null as string | null,
		parentFolderId: null as string | null,
		parentTagId: null as string | null,
		links,
		mentions,
		pages,
	}) satisfies ExportedWorld['mindmapNodes'][number]

const makeMindmapLink = (sourceNodeId: string, targetNodeId: string, id = 'link-1') =>
	({
		id,
		createdAt: now,
		updatedAt: now,
		direction: 'Normal' as const,
		sourceNodeId,
		targetNodeId,
		content: '',
	}) satisfies ExportedWorld['mindmapNodes'][number]['links'][number]

const makeTrack = (worldId: string, id = 'track-1') => ({
	id,
	createdAt: now,
	updatedAt: now,
	name: 'Track',
	worldId,
	position: 0,
	visible: true,
})

const makeSavedColor = (worldId: string, id = 'color-1') => ({
	id,
	createdAt: now,
	updatedAt: now,
	worldId,
	label: null,
	value: '#000',
})

const makeIconSet = (worldId: string, id = 'iconset-1') => ({
	id,
	worldId,
	iconSet: 'default',
})

const makeWorld = (ownerId: string, id = 'world-1', overrides: Partial<Record<string, unknown>> = {}) =>
	({
		id,
		createdAt: now,
		updatedAt: now,
		name: 'World',
		description: '',
		accessMode: 'Private' as const,
		calendar: null,
		ownerId,
		timeOrigin: BigInt(0),
		actors: [] as ReturnType<typeof makeActor>[],
		events: [] as ReturnType<typeof makeEvent>[],
		articles: [] as ReturnType<typeof makeArticle>[],
		tags: [] as ReturnType<typeof makeTag>[],
		folders: [] as ReturnType<typeof makeFolder>[],
		savedColors: [] as ReturnType<typeof makeSavedColor>[],
		worldCommonIconSets: [] as ReturnType<typeof makeIconSet>[],
		worldEventTracks: [] as ReturnType<typeof makeTrack>[],
		mindmapNodes: [] as ReturnType<typeof makeMindmapNode>[],
		calendars: [] as ReturnType<typeof makeCalendar>[],
		...overrides,
	}) satisfies ExportedData['user']['worlds'][number]

const makeCalendarUnit = (calendarId: string, id = 'unit-1') => ({
	id,
	createdAt: now,
	updatedAt: now,
	name: 'Unit',
	position: 0,
	calendarId,
	formatMode: 'Numeric' as const,
	negativeFormat: 'MinusSign' as const,
	displayName: null,
	displayNameShort: null,
	displayNamePlural: null,
	formatShorthand: null,
	duration: BigInt(1),
	treeDepth: 0,
	children: [] as Array<{
		id: string
		createdAt: Date
		updatedAt: Date
		label: string | null
		position: number
		calendarId: string
		shortLabel: string | null
		repeats: number
		parentUnitId: string
		childUnitId: string
	}>,
})

const makeCalendarSeason = (calendarId: string, id = 'season-1') => ({
	id,
	createdAt: now,
	updatedAt: now,
	name: 'Season',
	position: 0,
	calendarId,
	formatShorthand: null,
	intervals: [] as Array<{
		id: string
		createdAt: Date
		updatedAt: Date
		calendarId: string
		leftIndex: number
		rightIndex: number
		seasonId: string
	}>,
})

const makeCalendarPresentation = (calendarId: string, id = 'pres-1') => ({
	id,
	createdAt: now,
	updatedAt: now,
	name: 'Presentation',
	calendarId,
	compression: 1,
	scaleFactor: 1,
	baselineUnitId: null,
	units: [] as Array<{
		id: string
		createdAt: Date
		updatedAt: Date
		name: string
		position: number
		calendarId: string
		formatString: string
		subdivision: number
		labeledIndices: number[]
		unitId: string
		presentationId: string
	}>,
})

const makeCalendar = (
	{ ownerId = null as string | null, worldId = null as string | null } = {},
	id = 'cal-1',
) => ({
	id,
	createdAt: now,
	updatedAt: now,
	name: 'Calendar',
	description: '',
	worldId,
	position: 0,
	ownerId,
	originTime: BigInt(0),
	dateFormat: null,
	units: [] as ReturnType<typeof makeCalendarUnit>[],
	seasons: [] as ReturnType<typeof makeCalendarSeason>[],
	presentations: [] as ReturnType<typeof makeCalendarPresentation>[],
})

const makeExportData = (
	userId: string,
	worlds = [makeWorld(userId)],
	calendars = [makeCalendar({ ownerId: userId })],
) =>
	({
		version: 4 as const,
		user: { id: userId, worlds, calendars },
	}) satisfies ExportedData

const makePrisma = ({
	foreignWorlds = [] as { id: string }[],
	foreignCalendars = [] as { id: string }[],
} = {}) =>
	({
		world: {
			findMany: vi.fn().mockResolvedValue(foreignWorlds),
		},
		calendar: {
			findMany: vi.fn().mockResolvedValue(foreignCalendars),
		},
		// Fix any type
	}) as unknown as ReturnType<typeof makePrisma>

type CapturedNested = { create: Array<Record<string, unknown>> }

type CapturedUserUpdate = {
	data: {
		calendars: { create: Array<{ units: CapturedNested }> }
		worlds: {
			create: Array<{
				actors: CapturedNested
				events: CapturedNested
				mindmapNodes: CapturedNested
				calendars: CapturedNested
				pages: CapturedNested
			}>
		}
	}
}

const tx = {
	world: { findMany: vi.fn().mockResolvedValue([]), deleteMany: vi.fn() },
	calendar: { findMany: vi.fn().mockResolvedValue([]), deleteMany: vi.fn() },
	user: {
		findUnique: vi.fn(),
		update: vi.fn<(args: CapturedUserUpdate) => Promise<unknown>>(),
	},
	pages: { createMany: vi.fn() },
	mention: { createMany: vi.fn() },
	wikiArticle: { createMany: vi.fn() },
	wikiFolder: { createMany: vi.fn() },
	contentPage: { createMany: vi.fn() },
	actor: { createMany: vi.fn() },
	worldEvent: { createMany: vi.fn() },
	tag: { createMany: vi.fn() },
	mindmapNode: { createMany: vi.fn() },
	mindmapLink: { createMany: vi.fn() },
	calendarUnitRelation: { createMany: vi.fn() },
}

beforeEach(() => {
	prismaMockRef.current = {
		$transaction: <R>(fn: (prisma: typeof tx) => Promise<R>): Promise<R> => fn(tx),
	} as unknown as typeof prismaMockRef.current

	for (const table of Object.values(tx)) {
		for (const fn of Object.values(table)) {
			fn.mockClear()
		}
	}
})

describe('DataMigrationService', () => {
	const userId = 'user-1'
	const ctx = { user: { id: userId } }

	describe('validateOwnership', () => {
		it('rejects import when a calendar is owned by another user', async () => {
			const data = makeExportData(userId)
			const prisma = makePrisma({ foreignCalendars: [{ id: 'cal-1' }] })
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'Import contains IDs owned by another user',
			)
		})

		it('rejects world whose ownerId does not match the importing user', async () => {
			const world = makeWorld('other-user', 'world-1')
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow('ownerId')
		})

		it('passes when no foreign ownership is found', async () => {
			const data = makeExportData(userId)
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).resolves.not.toThrow()
		})

		it('rejects actor with wrong worldId', async () => {
			const world = makeWorld(userId)
			world.actors = [makeActor('wrong-world-id')]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'contains children with mismatched worldId',
			)
		})

		it('rejects actor page with wrong actorId', async () => {
			const world = makeWorld(userId)
			world.actors = [
				makeActor(world.id, 'actor-1', [], [makePage(world.id, { parentActorId: 'wrong-actor-id' })]),
			]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'references an entity outside the world',
			)
		})

		it('rejects event with wrong worldId', async () => {
			const world = makeWorld(userId)
			world.events = [makeEvent('wrong-world-id')]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'contains children with mismatched worldId',
			)
		})

		it('rejects article with wrong worldId', async () => {
			const world = makeWorld(userId)
			world.articles = [makeArticle('wrong-world-id')]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'contains children with mismatched worldId',
			)
		})

		it('rejects article page with wrong articleId', async () => {
			const world = makeWorld(userId)
			world.articles = [
				makeArticle(world.id, 'article-1', {
					pages: [makePage(world.id, { parentArticleId: 'wrong-article-id' })],
				}),
			]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'references an entity outside the world',
			)
		})

		it('rejects event page with wrong eventId', async () => {
			const world = makeWorld(userId)
			world.events = [
				makeEvent(world.id, 'event-1', [], [makePage('event-page-1', { parentEventId: 'wrong-event-id' })]),
			]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'references an entity outside the world',
			)
		})

		it('accepts mention with valid event pageId', async () => {
			const world = makeWorld(userId)
			const page = makePage('event-page-1', { parentEventId: 'event-1' })
			const event = makeEvent(world.id, 'event-1', [], [page])
			const actor = makeActor(world.id, 'actor-1')
			actor.mentions = [makeMention('actor-1', 'event-1', { pageId: 'event-page-1' })]
			world.actors = [actor]
			world.events = [event]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).resolves.not.toThrow()
		})

		it('rejects tag with wrong worldId', async () => {
			const world = makeWorld(userId)
			world.tags = [makeTag('wrong-world-id')]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'contains children with mismatched worldId',
			)
		})

		it('rejects savedColor with wrong worldId', async () => {
			const world = makeWorld(userId)
			world.savedColors = [makeSavedColor('wrong-world-id')]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'contains children with mismatched worldId',
			)
		})

		it('rejects worldEventTrack with wrong worldId', async () => {
			const world = makeWorld(userId)
			world.worldEventTracks = [makeTrack('wrong-world-id')]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'contains children with mismatched worldId',
			)
		})

		it('rejects mindmapNode with wrong worldId', async () => {
			const world = makeWorld(userId)
			world.mindmapNodes = [makeMindmapNode('wrong-world-id')]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'contains children with mismatched worldId',
			)
		})

		it('rejects worldCommonIconSet with wrong worldId', async () => {
			const world = makeWorld(userId)
			world.worldCommonIconSets = [makeIconSet('wrong-world-id')]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'contains children with mismatched worldId',
			)
		})

		it('rejects calendar unit with wrong calendarId', async () => {
			const cal = makeCalendar({ ownerId: userId })
			cal.units = [makeCalendarUnit('wrong-cal')]
			const data = makeExportData(userId, [makeWorld(userId)], [cal])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'contains children with mismatched calendarId',
			)
		})

		it('rejects calendar season with wrong calendarId', async () => {
			const cal = makeCalendar({ ownerId: userId })
			cal.seasons = [makeCalendarSeason('wrong-cal')]
			const data = makeExportData(userId, [makeWorld(userId)], [cal])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'contains children with mismatched calendarId',
			)
		})

		it('rejects calendar presentation with wrong calendarId', async () => {
			const cal = makeCalendar({ ownerId: userId })
			cal.presentations = [makeCalendarPresentation('wrong-cal')]
			const data = makeExportData(userId, [makeWorld(userId)], [cal])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'contains children with mismatched calendarId',
			)
		})

		it('rejects calendar unit child with wrong calendarId', async () => {
			const cal = makeCalendar({ ownerId: userId })
			const unit = makeCalendarUnit(cal.id)
			unit.children = [
				{
					id: 'child-1',
					createdAt: now,
					updatedAt: now,
					label: null,
					position: 0,
					calendarId: 'wrong-cal',
					shortLabel: null,
					repeats: 1,
					parentUnitId: unit.id,
					childUnitId: 'other',
				},
			]
			cal.units = [unit]
			const data = makeExportData(userId, [makeWorld(userId)], [cal])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'contains children with mismatched calendarId',
			)
		})

		it('rejects season interval with wrong calendarId', async () => {
			const cal = makeCalendar({ ownerId: userId })
			const season = makeCalendarSeason(cal.id)
			season.intervals = [
				{
					id: 'interval-1',
					createdAt: now,
					updatedAt: now,
					calendarId: 'wrong-cal',
					leftIndex: 0,
					rightIndex: 1,
					seasonId: season.id,
				},
			]
			cal.seasons = [season]
			const data = makeExportData(userId, [makeWorld(userId)], [cal])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'contains children with mismatched calendarId',
			)
		})

		it('rejects mention with sourceActorId pointing outside the world', async () => {
			const world = makeWorld(userId)
			const actor = makeActor(world.id, 'actor-1')
			const event = makeEvent(world.id, 'event-1')
			actor.mentions = [makeMention('actor-1', 'event-1', { sourceActorId: 'nonexistent' })]
			world.actors = [actor]
			world.events = [event]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'references entity outside the world',
			)
		})

		it('rejects mention with targetEventId pointing outside the world', async () => {
			const world = makeWorld(userId)
			const actor = makeActor(world.id, 'actor-1')
			actor.mentions = [makeMention('actor-1', 'event-1', { targetEventId: 'nonexistent' })]
			world.actors = [actor]
			world.events = [makeEvent(world.id, 'event-1')]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'references entity outside the world',
			)
		})

		it('accepts valid mention within the same world', async () => {
			const world = makeWorld(userId)
			const actor = makeActor(world.id, 'actor-1')
			const event = makeEvent(world.id, 'event-1')
			actor.mentions = [makeMention('actor-1', 'event-1')]
			world.actors = [actor]
			world.events = [event]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).resolves.not.toThrow()
		})

		it('rejects mention with pageId pointing outside the world', async () => {
			const world = makeWorld(userId)
			const actor = makeActor(world.id, 'actor-1')
			const event = makeEvent(world.id, 'event-1')
			actor.mentions = [makeMention('actor-1', 'event-1', { pageId: 'nonexistent-page' })]
			world.actors = [actor]
			world.events = [event]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'references a page outside the world',
			)
		})

		it('accepts mention with valid pageId', async () => {
			const world = makeWorld(userId)
			const page = makePage('page-1', { parentArticleId: 'article-1' })
			const article = makeArticle(world.id, 'article-1', { pages: [page] })
			const actor = makeActor(world.id, 'actor-1')
			actor.mentions = [
				makeMention('actor-1', 'article-1', {
					targetEventId: null,
					targetArticleId: 'article-1',
					pageId: 'page-1',
				}),
			]
			world.actors = [actor]
			world.articles = [article]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).resolves.not.toThrow()
		})

		it('rejects mention with sourceId/targetId pointing outside the world even when typed fields are valid', async () => {
			const world = makeWorld(userId)
			const actor = makeActor(world.id, 'actor-1')
			const event = makeEvent(world.id, 'event-1')
			actor.mentions = [
				makeMention('nonexistent-source', 'nonexistent-target', {
					sourceActorId: 'actor-1',
					targetEventId: 'event-1',
				}),
			]
			world.actors = [actor]
			world.events = [event]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'references entity outside the world',
			)
		})

		it('rejects tag mention with invalid target', async () => {
			const world = makeWorld(userId)
			const tag = makeTag(world.id, 'tag-1')
			tag.mentions = [
				makeMention('tag-1', 'nonexistent', {
					sourceType: 'Tag',
					sourceActorId: null,
					sourceTagId: 'tag-1',
					targetEventId: 'nonexistent',
				}),
			]
			world.tags = [tag]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'references entity outside the world',
			)
		})

		it('rejects mindmap link with sourceNodeId outside the world', async () => {
			const world = makeWorld(userId)
			const node = makeMindmapNode(world.id, 'node-1', [makeMindmapLink('nonexistent', 'node-1')])
			world.mindmapNodes = [node]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'references a node outside the world',
			)
		})

		it('rejects mindmap link with targetNodeId outside the world', async () => {
			const world = makeWorld(userId)
			const node = makeMindmapNode(world.id, 'node-1', [makeMindmapLink('node-1', 'nonexistent')])
			world.mindmapNodes = [node]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'references a node outside the world',
			)
		})

		it('accepts mindmap link between two valid nodes', async () => {
			const world = makeWorld(userId)
			const node1 = makeMindmapNode(world.id, 'node-1', [makeMindmapLink('node-1', 'node-2')])
			const node2 = makeMindmapNode(world.id, 'node-2')
			world.mindmapNodes = [node1, node2]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).resolves.not.toThrow()
		})

		it('rejects article with worldId outside its world', async () => {
			const world = makeWorld(userId)
			world.articles = [makeArticle('different-world', 'art-1')]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'contains children with mismatched worldId',
			)
		})

		it('rejects article with parentId outside its world', async () => {
			const world = makeWorld(userId)
			world.articles = [makeArticle(world.id, 'art-1', { parentId: 'nonexistent' })]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'has a parent outside its world',
			)
		})

		it('accepts article with valid parentId', async () => {
			const world = makeWorld(userId)
			world.folders = [makeFolder(world.id, 'folder-parent')]
			world.articles = [makeArticle(world.id, 'art-child', { parentId: 'folder-parent' })]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).resolves.not.toThrow()
		})

		it('accepts article with null parentId', async () => {
			const world = makeWorld(userId)
			world.articles = [makeArticle(world.id, 'art-1')]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).resolves.not.toThrow()
		})

		it('rejects calendar with both worldId and ownerId', async () => {
			const cal = makeCalendar({ ownerId: userId, worldId: 'world-1' })
			const data = makeExportData(userId, [makeWorld(userId)], [cal])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'must be owned by either a world or a user, not both or neither',
			)
		})

		it('rejects calendar with neither worldId nor ownerId', async () => {
			const cal = makeCalendar({ ownerId: null, worldId: null })
			const data = makeExportData(userId, [makeWorld(userId)], [cal])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'must be owned by either a world or a user, not both or neither',
			)
		})

		it('rejects calendar with ownerId set to a different user', async () => {
			const cal = makeCalendar({ ownerId: 'other-user' })
			const data = makeExportData(userId, [makeWorld(userId)], [cal])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'has ownerId set to a different user',
			)
		})

		it('rejects world-owned calendar whose world is not in the import', async () => {
			const cal = makeCalendar({ worldId: 'missing-world' })
			const data = makeExportData(userId, [makeWorld(userId)], [cal])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'references world missing-world, which is not in the import',
			)
		})

		it('accepts world-owned calendar whose world IS in the import', async () => {
			const world = makeWorld(userId, 'world-1')
			const cal = makeCalendar({ worldId: 'world-1' })
			const data = makeExportData(userId, [world], [cal])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).resolves.not.toThrow()
		})

		it('accepts user-owned calendar with correct ownerId', async () => {
			const cal = makeCalendar({ ownerId: userId })
			const data = makeExportData(userId, [makeWorld(userId)], [cal])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).resolves.not.toThrow()
		})

		it('rejects mention referencing entity in a different world', async () => {
			const world1 = makeWorld(userId, 'world-1')
			const world2 = makeWorld(userId, 'world-2')
			const actor1 = makeActor('world-1', 'actor-in-w1')
			const actor2 = makeActor('world-2', 'actor-in-w2')
			actor1.mentions = [
				makeMention('actor-in-w1', 'actor-in-w2', {
					targetEventId: null,
					targetActorId: 'actor-in-w2',
				}),
			]
			world1.actors = [actor1]
			world2.actors = [actor2]
			const data = makeExportData(userId, [world1, world2])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'references entity outside the world',
			)
		})

		it('handles empty worlds and calendars', async () => {
			const data = makeExportData(userId, [], [])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).resolves.not.toThrow()
		})

		it('handles world with all empty entity arrays', async () => {
			const data = makeExportData(userId, [makeWorld(userId)])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).resolves.not.toThrow()
		})

		it('rejects content page with parentActorId pointing outside the world', async () => {
			const world = makeWorld(userId)
			const page = makePage('page-1')
			page.parentActorId = 'nonexistent-actor'
			const article = makeArticle(world.id, 'article-1', { pages: [page] })
			world.articles = [article]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow()
		})

		it('rejects event with worldEventTrackId pointing outside the world', async () => {
			const world = makeWorld(userId)
			world.events = [makeEvent(world.id, 'event-1')]
			world.events[0].worldEventTrackId = 'nonexistent-track'
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow()
		})

		for (const key of [
			'parentActorId',
			'parentArticleId',
			'parentEventId',
			'parentFolderId',
			'parentTagId',
		] as const) {
			it(`rejects mindmapNode with ${key} pointing outside the world`, async () => {
				const world = makeWorld(userId)
				const node = makeMindmapNode(world.id, 'node-1')
				node[key] = 'nonexistent'
				world.mindmapNodes = [node]
				const data = makeExportData(userId, [world])
				const prisma = makePrisma()
				await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
					'references a parent outside its world',
				)
			})
		}

		it('accepts mindmapNode whose parents are all inside the world', async () => {
			const world = makeWorld(userId)
			world.articles = [makeArticle(world.id, 'article-1')]
			world.tags = [makeTag(world.id, 'tag-1')]
			world.folders = [makeFolder(world.id, 'folder-1')]
			world.events = [makeEvent(world.id, 'event-1')]
			const articleNode = makeMindmapNode(world.id, 'node-1')
			articleNode.parentArticleId = 'article-1'
			const tagNode = makeMindmapNode(world.id, 'node-2')
			tagNode.parentTagId = 'tag-1'
			const folderNode = makeMindmapNode(world.id, 'node-3')
			folderNode.parentFolderId = 'folder-1'
			const eventNode = makeMindmapNode(world.id, 'node-4')
			eventNode.parentEventId = 'event-1'
			world.mindmapNodes = [articleNode, tagNode, folderNode, eventNode]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).resolves.not.toThrow()
		})

		it('rejects node mention with target outside the world', async () => {
			const world = makeWorld(userId)
			const node = makeMindmapNode(
				world.id,
				'node-1',
				[],
				[
					makeMention('node-1', 'nonexistent', {
						sourceType: 'Node',
						sourceActorId: null,
						sourceNodeId: 'node-1',
						targetEventId: 'nonexistent',
					}),
				],
			)
			world.mindmapNodes = [node]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'references entity outside the world',
			)
		})

		it('accepts node mention targeting an entity inside the world', async () => {
			const world = makeWorld(userId)
			world.events = [makeEvent(world.id, 'event-1')]
			const node = makeMindmapNode(
				world.id,
				'node-1',
				[],
				[
					makeMention('node-1', 'event-1', {
						sourceType: 'Node',
						sourceActorId: null,
						sourceNodeId: 'node-1',
					}),
				],
			)
			world.mindmapNodes = [node]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).resolves.not.toThrow()
		})

		it('rejects node page attributed to a different node', async () => {
			const world = makeWorld(userId)
			const page = makePage('page-1', { parentType: 'Node', parentNodeId: 'other-node' })
			const node = makeMindmapNode(world.id, 'node-1', [], [], [page])
			world.mindmapNodes = [node, makeMindmapNode(world.id, 'other-node')]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'is not attributed correctly',
			)
		})

		it('uses ctx.user.id (not data.user.id) for the foreign-ownership lookup', async () => {
			const world = makeWorld('other-user', 'world-1')
			const data = makeExportData('other-user', [world])
			const prisma = makePrisma()
			await DataMigrationService.validateOwnership(ctx, data, prisma)
			expect(prisma.world.findMany).toHaveBeenCalledWith({
				where: { id: { in: ['world-1'] }, ownerId: { not: userId } },
				select: { id: true },
			})
			expect(prisma.calendar.findMany).toHaveBeenCalledWith({
				where: { id: { in: ['cal-1'] }, ownerId: { not: userId } },
				select: { id: true },
			})
		})

		it('rejects world-owned calendar with mismatched worldId', async () => {
			const world = makeWorld(userId, 'world-1')
			const cal = makeCalendar({ worldId: 'wrong-world' }, 'cal-w-1')
			world.calendars = [cal]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'contains children with mismatched worldId',
			)
		})

		it('rejects world-owned calendar unit with mismatched calendarId', async () => {
			const world = makeWorld(userId, 'world-1')
			const cal = makeCalendar({ worldId: 'world-1' }, 'cal-w-1')
			cal.units = [makeCalendarUnit('wrong-cal')]
			world.calendars = [cal]
			const data = makeExportData(userId, [world])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).rejects.toThrow(
				'contains children with mismatched calendarId',
			)
		})

		it('accepts world with valid world-owned calendar and its children', async () => {
			const world = makeWorld(userId, 'world-1')
			const cal = makeCalendar({ worldId: 'world-1' }, 'cal-w-1')
			cal.units = [makeCalendarUnit('cal-w-1')]
			cal.seasons = [makeCalendarSeason('cal-w-1')]
			world.calendars = [cal]
			const data = makeExportData(userId, [world], [])
			const prisma = makePrisma()
			await expect(DataMigrationService.validateOwnership(ctx, data, prisma)).resolves.not.toThrow()
		})
	})

	describe('validateUserData', () => {
		it('returns invalid for completely wrong structure', async () => {
			const prisma = makePrisma()
			const result = await DataMigrationService.validateUserData(ctx, JSON.stringify({ foo: 'bar' }), prisma)
			expect(result.isValid).toBe(false)
			expect(result.error).toBeTruthy()
		})

		it('returns invalid for empty object', async () => {
			const prisma = makePrisma()
			const result = await DataMigrationService.validateUserData(ctx, JSON.stringify({}), prisma)
			expect(result.isValid).toBe(false)
		})

		it('returns invalid for missing user field', async () => {
			const prisma = makePrisma()
			const result = await DataMigrationService.validateUserData(ctx, JSON.stringify({ version: 1 }), prisma)
			expect(result.isValid).toBe(false)
		})

		it('version check in code is unreachable because schema enforces version: 4', async () => {
			const prisma = makePrisma()
			const result = await DataMigrationService.validateUserData(
				ctx,
				JSON.stringify({
					version: 3,
					user: { id: 'u', worlds: [], calendars: [] },
				}),
				prisma,
			)
			expect(result.isValid).toBe(false)
			expect(result.error).not.toContain('Unsupported version')
		})
	})

	describe('importUserData', () => {
		it('throws on invalid data', async () => {
			await expect(
				DataMigrationService.importUserData(ctx, JSON.stringify({ bad: true }), {
					dryRun: false,
				}),
			).rejects.toThrow('Invalid user data')
		})

		it('inserts mindmap nodes via separate createMany after user.update (not nested)', async () => {
			const world = makeWorld(userId)
			world.mindmapNodes = [
				makeMindmapNode(world.id, 'n1', [makeMindmapLink('n1', 'n2', 'l1')]),
				makeMindmapNode(world.id, 'n2'),
			]
			const data = makeExportData(userId, [world], [])
			await DataMigrationService.importUserData(ctx, serialize(data), { dryRun: false })

			expect(tx.mindmapNode.createMany).toHaveBeenCalledWith({
				data: [expect.objectContaining({ id: 'n1' }), expect.objectContaining({ id: 'n2' })],
			})
		})

		it('inserts mindmap links via separate createMany after user.update (not nested)', async () => {
			const world = makeWorld(userId)
			world.mindmapNodes = [
				makeMindmapNode(world.id, 'n1', [makeMindmapLink('n1', 'n2', 'l1')]),
				makeMindmapNode(world.id, 'n2'),
			]
			const data = makeExportData(userId, [world], [])
			await DataMigrationService.importUserData(ctx, serialize(data), { dryRun: false })

			expect(tx.mindmapLink.createMany).toHaveBeenCalledWith({
				data: [expect.objectContaining({ id: 'l1', sourceNodeId: 'n1', targetNodeId: 'n2' })],
			})
		})

		it('inserts mindmap node pages and mentions alongside other entities', async () => {
			const world = makeWorld(userId)
			world.events = [makeEvent(world.id, 'event-1')]
			const page = makePage('node-page-1', { parentType: 'Node', parentNodeId: 'n1' })
			const mention = makeMention('n1', 'event-1', {
				sourceType: 'Node',
				sourceActorId: null,
				sourceNodeId: 'n1',
				pageId: 'node-page-1',
			})
			world.mindmapNodes = [makeMindmapNode(world.id, 'n1', [], [mention], [page])]
			const data = makeExportData(userId, [world], [])
			await DataMigrationService.importUserData(ctx, serialize(data), { dryRun: false })

			const insertedNode = tx.mindmapNode.createMany.mock.calls[0][0].data[0]
			expect(insertedNode).not.toHaveProperty('pages')
			expect(insertedNode).not.toHaveProperty('mentions')
			expect(tx.contentPage.createMany).toHaveBeenCalledWith({
				data: [expect.objectContaining({ id: 'node-page-1', parentNodeId: 'n1' })],
			})
			expect(tx.mention.createMany).toHaveBeenCalledWith({
				data: [expect.objectContaining({ id: mention.id, sourceNodeId: 'n1', pageId: 'node-page-1' })],
			})
		})

		it('inserts calendar unit relations via separate createMany after user.update (not nested)', async () => {
			// Same problem as mindmap links: a CalendarUnitRelation references a
			// sibling CalendarUnit via childUnitId. Has to be flattened.
			const cal = makeCalendar({ ownerId: userId })
			const unit = makeCalendarUnit(cal.id, 'u1')
			unit.children = [
				{
					id: 'rel-1',
					createdAt: now,
					updatedAt: now,
					label: null,
					position: 0,
					calendarId: cal.id,
					shortLabel: null,
					repeats: 1,
					parentUnitId: 'u1',
					childUnitId: 'u1',
				},
			]
			cal.units = [unit]
			const data = makeExportData(userId, [], [cal])
			await DataMigrationService.importUserData(ctx, serialize(data), { dryRun: false })

			expect(tx.calendarUnitRelation.createMany).toHaveBeenCalledWith({
				data: [expect.objectContaining({ id: 'rel-1', parentUnitId: 'u1', childUnitId: 'u1' })],
			})

			const updateArgs = tx.user.update.mock.calls[0][0]
			const units = updateArgs.data.calendars.create[0].units.create
			units.forEach((u) => expect(u).not.toHaveProperty('children'))
		})

		it('imports world-owned calendars nested under each world create', async () => {
			const world = makeWorld(userId, 'world-1')
			const cal = makeCalendar({ worldId: 'world-1' }, 'cal-w-1')
			world.calendars = [cal]
			const data = makeExportData(userId, [world], [])
			await DataMigrationService.importUserData(ctx, serialize(data), { dryRun: false })

			const updateArgs = tx.user.update.mock.calls[0][0]
			const worldArg = updateArgs.data.worlds.create[0]
			expect(worldArg.calendars.create).toHaveLength(1)
			expect(worldArg.calendars.create[0]).toMatchObject({ id: 'cal-w-1' })
			expect(worldArg.calendars.create[0]).not.toHaveProperty('worldId')
			expect(worldArg.calendars.create[0]).not.toHaveProperty('ownerId')
		})

		it('inserts event content-pages via contentPage.createMany', async () => {
			const world = makeWorld(userId)
			const page = makePage('event-page-1', { parentEventId: 'event-1' })
			const event = makeEvent(world.id, 'event-1', [], [page])
			const actor = makeActor(world.id, 'actor-1')
			actor.mentions = [makeMention('actor-1', 'event-1', { pageId: 'event-page-1' })]
			world.actors = [actor]
			world.events = [event]
			const data = makeExportData(userId, [world], [])
			await DataMigrationService.importUserData(ctx, serialize(data), { dryRun: false })

			expect(tx.contentPage.createMany).toHaveBeenCalledWith({
				data: expect.arrayContaining([expect.objectContaining({ id: 'event-page-1' })]),
			})
		})

		it('inserts actor, event and article pages together in one contentPage.createMany', async () => {
			const world = makeWorld(userId)
			world.actors = [makeActor(world.id, 'actor-1', [], [makePage('ap', { parentActorId: 'actor-1' })])]
			world.events = [makeEvent(world.id, 'event-1', [], [makePage('ep', { parentEventId: 'event-1' })])]
			world.articles = [
				makeArticle(world.id, 'article-1', {
					pages: [makePage('rp', { parentArticleId: 'article-1' })],
				}),
			]
			const data = makeExportData(userId, [world], [])
			await DataMigrationService.importUserData(ctx, serialize(data), { dryRun: false })

			const captured = tx.contentPage.createMany.mock.calls[0][0] as { data: Array<{ id: string }> }
			expect(captured.data.map((p) => p.id)).toEqual(expect.arrayContaining(['ap', 'ep', 'rp']))
		})
	})

	describe('isImportValid', () => {
		it('returns null when valid data runs through the full dry-run transaction', async () => {
			const data = makeExportData(userId)
			await expect(DataMigrationService.isImportValid(ctx, serialize(data))).resolves.toBeNull()
			// Dry-run still executes the writes (the sentinel rolls them back).
			expect(tx.user.update).toHaveBeenCalled()
		})

		it('throws BadRequestError when validation fails', async () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
			try {
				await expect(DataMigrationService.isImportValid(ctx, JSON.stringify({ bad: true }))).rejects.toThrow(
					'Invalid user data',
				)
				expect(errorSpy).toHaveBeenCalled()
			} finally {
				errorSpy.mockRestore()
			}
		})
	})
})
