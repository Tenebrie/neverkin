import { AuditAction, User } from '@prisma/client'
import { DefaultContext, DefaultState, ParameterizedContext } from 'koa'

import { AuditLogUncheckedCreateInput, AuditLogWhereInput } from '../../prisma/client/models.js'
import { getPrismaClient } from './dbClients/DatabaseClient.js'

export const AuditLogService = {
	getStats: async ({ days }: { days: number }) => {
		const now = new Date()
		const today = new Date(now)
		today.setUTCHours(0, 0, 0, 0)
		const historyDays = days * 2
		const start = new Date(today.getTime() - (historyDays - 1) * DAY_MS)

		const rows = await getPrismaClient().auditLog.findMany({
			where: { createdAt: { gte: start } },
			select: { createdAt: true, action: true, userId: true },
		})

		const dayOf = (date: Date) => Math.floor((date.getTime() - start.getTime()) / DAY_MS)
		const counts = Array.from({ length: historyDays }, () => emptyDailyCounts())
		const activeDays = new Map<string, Set<number>>()
		const loginUsers = new Set<string>()

		for (const row of rows) {
			const day = counts[dayOf(row.createdAt)]
			day.totalEvents += 1
			const key = COUNTED_ACTIONS[row.action]
			if (key) {
				day[key] += 1
			}
			if (row.action === 'UserAuth' && row.userId) {
				activeDays.set(row.userId, (activeDays.get(row.userId) ?? new Set()).add(dayOf(row.createdAt)))
			}
			if ((row.action === 'UserLoginWithPassword' || row.action === 'UserLoginWithGoogle') && row.userId) {
				loginUsers.add(row.userId)
			}
		}

		const usersActiveWithin = (from: number, to: number, minDays = 1) =>
			[...activeDays.values()].filter(
				(set) => [...set].filter((day) => day >= from && day <= to).length >= minDays,
			).length

		const usersActiveBetween = (from: Date, to: Date) =>
			new Set(
				rows
					.filter(
						(row) => row.action === 'UserAuth' && row.userId && row.createdAt >= from && row.createdAt <= to,
					)
					.map((row) => row.userId),
			).size
		const usersActiveSince = (since: Date) => usersActiveBetween(since, now)

		const currentHour = new Date(now)
		currentHour.setUTCMinutes(0, 0, 0)
		const hourly = Array.from({ length: 24 }, (_, i) => {
			const hour = new Date(currentHour.getTime() - (23 - i) * HOUR_MS)
			const end = new Date(hour.getTime() + HOUR_MS)
			return {
				hour: hour.toISOString(),
				dailyActiveUsers: usersActiveBetween(new Date(end.getTime() - DAY_MS), end),
			}
		})

		const lastDay = historyDays - 1
		const daily = counts.slice(days).map((day, i) => {
			const index = days + i
			return {
				day: new Date(start.getTime() + index * DAY_MS).toISOString(),
				...day,
				dailyActiveUsers: usersActiveWithin(index, index),
				weeklyActiveUsers: usersActiveWithin(index - 6, index),
				monthlyActiveUsers: usersActiveWithin(index - days + 1, index),
				regulars: usersActiveWithin(index - days + 1, index, REGULAR_ACTIVE_DAYS),
			}
		})

		const totals = emptyDailyCounts()
		for (const day of counts.slice(days)) {
			for (const key of Object.keys(totals) as (keyof DailyCounts)[]) {
				totals[key] += day[key]
			}
		}

		return {
			...totals,
			uniqueUserLogins: loginUsers.size,
			dailyActiveUsers: usersActiveSince(new Date(now.getTime() - DAY_MS)),
			weeklyActiveUsers: usersActiveSince(new Date(now.getTime() - 7 * DAY_MS)),
			monthlyActiveUsers: usersActiveSince(new Date(now.getTime() - days * DAY_MS)),
			regulars: usersActiveWithin(lastDay - days + 1, lastDay, REGULAR_ACTIVE_DAYS),
			hourly,
			daily,
		}
	},

	append: async (
		ctx: ParameterizedContext<DefaultState, DefaultContext & { user?: User }>,
		params: Omit<AuditLogUncheckedCreateInput, 'requestIp' | 'id' | 'createdAt' | 'data'> & {
			data?: AuditLogUncheckedCreateInput['data']
		},
		options: {
			minimalGapSeconds?: number
		} = {},
	) => {
		const requestIp = ctx.request.ip
		const userId = params.userId ?? ctx.user?.id

		if (userId && options.minimalGapSeconds) {
			const lastEvent = await getPrismaClient().auditLog.findFirst({
				where: {
					userId,
					action: params.action,
					createdAt: {
						gte: new Date(Date.now() - options.minimalGapSeconds * 1000),
					},
				},
				select: {
					id: true,
				},
			})
			if (lastEvent) {
				return
			}
		}

		await getPrismaClient().auditLog.create({
			data: {
				...params,
				data: params.data ?? {},
				userId,
				requestIp,
			},
		})
	},

	getLogs: async ({ page, size, query }: { page?: number; size?: number; query?: string }) => {
		const actualPage = page ?? 0
		const actualSize = Math.min(size ?? 20, 100)
		const allActions = Object.values(AuditAction)
		const matchingActions = query
			? allActions.filter((a) => a.toLowerCase().includes(query.toLowerCase()))
			: []
		const whereClause: AuditLogWhereInput = query
			? {
					OR: [
						{
							user: {
								id: { contains: query, mode: 'insensitive' },
								email: { contains: query, mode: 'insensitive' },
							},
						},
						{ requestIp: { contains: query, mode: 'insensitive' } },
						...(matchingActions.length > 0 ? [{ action: { in: matchingActions } }] : []),
					],
				}
			: {}
		const result = await getPrismaClient().auditLog.findMany({
			where: whereClause,
			orderBy: [{ createdAt: 'desc' }],
			skip: actualPage * actualSize,
			take: actualSize,
			include: {
				user: {
					select: {
						id: true,
						username: true,
						email: true,
					},
				},
			},
		})
		const rowCount = await getPrismaClient().auditLog.aggregate({
			_count: { _all: true },
			where: whereClause,
		})
		return {
			logs: result.map((log) => ({
				...log,
				data: JSON.stringify(log.data),
			})),
			page: actualPage,
			size: actualSize,
			pageCount: Math.ceil(rowCount._count._all / actualSize),
		}
	},
}

const HOUR_MS = 3_600_000
const DAY_MS = 24 * HOUR_MS
const REGULAR_ACTIVE_DAYS = 7

const COUNTED_ACTIONS = {
	UserAuth: 'userAuthEvents',
	GuestCreateAccount: 'guestAccountsCreated',
	UserCreateAccount: 'userAccountsCreated',
	UserLoginWithPassword: 'passwordLogins',
	UserLoginWithGoogle: 'googleLogins',
	UserLoginFailed: 'failedLogins',
	UserDeleteAccount: 'accountsDeleted',
	AdminImpersonateUser: 'adminImpersonations',
} as const satisfies Partial<Record<AuditAction, string>>

type DailyCounts = Record<(typeof COUNTED_ACTIONS)[keyof typeof COUNTED_ACTIONS] | 'totalEvents', number>

const emptyDailyCounts = (): DailyCounts => ({
	userAuthEvents: 0,
	guestAccountsCreated: 0,
	userAccountsCreated: 0,
	passwordLogins: 0,
	googleLogins: 0,
	failedLogins: 0,
	accountsDeleted: 0,
	adminImpersonations: 0,
	totalEvents: 0,
})
