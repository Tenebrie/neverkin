import { UserLevel } from '@prisma/client'
import * as bcrypt from 'bcrypt'

import { UserUncheckedUpdateInput } from '../../prisma/client/models.js'
import { getPrismaClient } from './dbClients/DatabaseClient.js'

export const AdminService = {
	listHourlyActivityStats: async ({ hours, excludeUserId }: { hours: number; excludeUserId: string }) => {
		const now = new Date()
		const start = new Date(now)
		start.setUTCMinutes(0, 0, 0)
		start.setUTCHours(start.getUTCHours() - (hours - 1))

		const rows = await getPrismaClient().auditLog.findMany({
			where: {
				createdAt: { gte: start },
				OR: [{ userId: null }, { userId: { not: excludeUserId } }],
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

	listContentStats: async ({ days }: { days: number }) => {
		const start = new Date()
		start.setUTCHours(0, 0, 0, 0)
		start.setUTCDate(start.getUTCDate() - (days - 1))
		const dayMs = 86_400_000

		const entries = await Promise.all(
			Object.entries(contentModels()).map(async ([key, model]) => {
				const [total, recent] = await Promise.all([
					model.count(),
					model.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
				])
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
			select: {
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
			},
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
			users: result.map((user) => ({
				...user,
				featureFlags: user.featureFlags.map((entry) => entry.flag),
			})),
			page: actualPage,
			size: actualSize,
			pageCount: Math.ceil(rowCount._count.id / actualSize),
		}
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

type CreatedAtModel = {
	count: () => Promise<number>
	findMany: (args: {
		where: { createdAt: { gte: Date } }
		select: { createdAt: true }
	}) => Promise<{ createdAt: Date }[]>
}

const asCreatedAtModels = <K extends string>(models: Record<K, CreatedAtModel>) => models

const contentModels = () => {
	const prisma = getPrismaClient()
	return asCreatedAtModels({
		worlds: prisma.world,
		actors: prisma.actor,
		events: prisma.worldEvent,
		eventTracks: prisma.worldEventTrack,
		articles: prisma.wikiArticle,
		folders: prisma.wikiFolder,
		tags: prisma.tag,
		nodes: prisma.mindmapNode,
		links: prisma.mindmapLink,
		calendars: prisma.calendar,
		contentPages: prisma.contentPage,
		assets: prisma.asset,
	})
}

type ContentEntity = keyof ReturnType<typeof contentModels>
