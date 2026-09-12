import { UserLevel } from '@prisma/client'
import * as bcrypt from 'bcrypt'

import { UserSelect, UserUncheckedUpdateInput } from '../../prisma/client/models.js'
import { getPrismaClient } from './dbClients/DatabaseClient.js'

export const AdminService = {
	listHourlyActivityStats: async ({
		hours,
		userId,
		excludeUserId,
	}: {
		hours: number
		userId?: string
		excludeUserId?: string
	}) => {
		const now = new Date()
		const start = new Date(now)
		start.setUTCMinutes(0, 0, 0)
		start.setUTCHours(start.getUTCHours() - (hours - 1))

		const rows = await getPrismaClient().auditLog.findMany({
			where: {
				createdAt: { gte: start },
				userId,
				...(excludeUserId ? { OR: [{ userId: null }, { userId: { not: excludeUserId } }] } : {}),
			},
			select: { createdAt: true, action: true, userId: true },
		})

		const buckets = Array.from({ length: hours }, (_, i) => ({
			hour: new Date(start.getTime() + i * 3_600_000).toISOString(),
			users: new Set<string>(),
			events: 0,
		}))
		for (const row of rows) {
			const bucket = buckets[Math.floor((row.createdAt.getTime() - start.getTime()) / 3_600_000)]
			bucket.events += 1
			if (row.userId) {
				bucket.users.add(row.userId)
			}
		}
		return buckets.map(({ hour, users, events }) => ({ hour, activeUsers: users.size, events }))
	},

	listContentStats: async ({ days, ownerId }: { days: number; ownerId?: string }) => {
		const start = new Date()
		start.setUTCHours(0, 0, 0, 0)
		start.setUTCDate(start.getUTCDate() - (days - 1))
		const dayMs = 86_400_000

		const entries = await Promise.all(
			Object.entries(contentModels()).map(async ([key, model]) => {
				const [total, recent] = await Promise.all([model.total(ownerId), model.createdSince(start, ownerId)])
				const created = Array.from({ length: days }, () => 0)
				for (const row of recent) {
					created[Math.floor((row.createdAt.getTime() - start.getTime()) / dayMs)] += 1
				}
				return [key, { total, created }] as const
			}),
		)

		return {
			days: Array.from({ length: days }, (_, i) => new Date(start.getTime() + i * dayMs).toISOString()),
			entities: Object.fromEntries(entries) as Record<ContentEntity, { total: number; created: number[] }>,
		}
	},

	listUsers: async ({ page, size, query }: { page?: number; size?: number; query?: string }) => {
		const actualPage = page ?? 0
		const actualSize = Math.min(size ?? 20, 100)
		const result = await getPrismaClient().user.findMany({
			select: adminUserSelect,
			where: {
				...(query
					? {
							deletedAt: null,
							OR: [
								{
									email: {
										contains: query,
										mode: 'insensitive',
									},
								},
								{
									username: {
										contains: query,
										mode: 'insensitive',
									},
								},
							],
						}
					: {}),
			},
			orderBy: [{ level: 'desc' }, { updatedAt: 'desc' }],
			skip: actualPage * actualSize,
			take: actualSize,
		})
		const rowCount = await getPrismaClient().user.aggregate({
			_count: {
				id: true,
			},
			where: {
				...(query
					? {
							OR: [
								{
									email: {
										contains: query,
										mode: 'insensitive',
									},
								},
								{
									username: {
										contains: query,
										mode: 'insensitive',
									},
								},
							],
						}
					: {}),
			},
		})
		return {
			users: result.map(flattenFeatureFlags),
			page: actualPage,
			size: actualSize,
			pageCount: Math.ceil(rowCount._count.id / actualSize),
		}
	},

	getUser: async (userId: string) => {
		const user = await getPrismaClient().user.findUnique({
			where: { id: userId },
			select: adminUserSelect,
		})
		return user ? flattenFeatureFlags(user) : null
	},

	getUserByEmailExact: async (email: string) => {
		const user = await getPrismaClient().user.findUnique({
			where: {
				email,
			},
			include: {
				featureFlags: {
					select: {
						flag: true,
					},
				},
			},
		})

		if (!user) {
			return null
		}

		return {
			...user,
			featureFlags: user.featureFlags.map((entry) => entry.flag),
		}
	},

	deleteUser: async (userId: string) => {
		return getPrismaClient().user.delete({
			where: {
				id: userId,
			},
		})
	},

	setUserLevel: async (userId: string, level: UserLevel) => {
		return getPrismaClient().user.update({
			where: {
				id: userId,
			},
			data: {
				level,
			},
		})
	},

	updateUser: async (userId: string, data: UserUncheckedUpdateInput) => {
		return getPrismaClient().user.update({
			where: {
				id: userId,
			},
			data,
		})
	},

	setUserPassword: async (userId: string, password: string) => {
		const hashedPassword = await bcrypt.hash(password, 12)
		return getPrismaClient().user.update({
			where: {
				id: userId,
			},
			data: {
				password: hashedPassword,
			},
		})
	},
}

const adminUserSelect = {
	id: true,
	email: true,
	level: true,
	username: true,
	bio: true,
	createdAt: true,
	updatedAt: true,
	featureFlags: {
		select: {
			flag: true,
		},
	},
} satisfies UserSelect

const flattenFeatureFlags = <T extends { featureFlags: { flag: string }[] }>(user: T) => ({
	...user,
	featureFlags: user.featureFlags.map((entry) => entry.flag),
})

type CreatedAtModel<W> = {
	count: (args: { where: W }) => Promise<number>
	findMany: (args: { where: W; select: { createdAt: true } }) => Promise<{ createdAt: Date }[]>
}

const contentModel = <W>(model: CreatedAtModel<W>, ownedBy: (ownerId?: string) => W) => ({
	total: (ownerId?: string) => model.count({ where: ownedBy(ownerId) }),
	createdSince: (start: Date, ownerId?: string) =>
		model.findMany({
			where: { ...ownedBy(ownerId), createdAt: { gte: start } },
			select: { createdAt: true },
		}),
})

const ownedBy =
	<W>(build: (ownerId: string) => W) =>
	(ownerId?: string): Partial<W> =>
		ownerId ? build(ownerId) : {}

const contentModels = () => {
	const prisma = getPrismaClient()
	const ownedDirectly = ownedBy((ownerId) => ({ ownerId }))
	const inOwnedWorld = ownedBy((ownerId) => ({ world: { ownerId } }))
	return {
		worlds: contentModel(prisma.world, ownedDirectly),
		actors: contentModel(prisma.actor, inOwnedWorld),
		events: contentModel(prisma.worldEvent, inOwnedWorld),
		eventTracks: contentModel(prisma.worldEventTrack, inOwnedWorld),
		articles: contentModel(prisma.wikiArticle, inOwnedWorld),
		folders: contentModel(prisma.wikiFolder, inOwnedWorld),
		tags: contentModel(prisma.tag, inOwnedWorld),
		nodes: contentModel(prisma.mindmapNode, inOwnedWorld),
		links: contentModel(
			prisma.mindmapLink,
			ownedBy((ownerId) => ({ sourceNode: { world: { ownerId } } })),
		),
		calendars: contentModel(
			prisma.calendar,
			ownedBy((ownerId) => ({ OR: [{ ownerId }, { world: { ownerId } }] })),
		),
		contentPages: contentModel(
			prisma.contentPage,
			ownedBy((ownerId) => ({
				OR: [
					{ parentActor: { world: { ownerId } } },
					{ parentEvent: { world: { ownerId } } },
					{ parentArticle: { world: { ownerId } } },
					{ parentNode: { world: { ownerId } } },
				],
			})),
		),
		assets: contentModel(prisma.asset, ownedDirectly),
	}
}

type ContentEntity = keyof ReturnType<typeof contentModels>
