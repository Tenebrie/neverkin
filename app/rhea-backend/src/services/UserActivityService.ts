import { ParameterizedContext } from 'koa'

import { AuditLogService } from './AuditLogService.js'

const RECENTLY_SEEN_TTL_MS = 10 * 60 * 1000
const LOG_GAP_SECONDS = 3600

const recentlySeen = new Map<string, number>()

export const UserActivityService = {
	recordActivity: (ctx: ParameterizedContext, userId: string) => {
		const seenAt = recentlySeen.get(userId)
		if (seenAt && Date.now() - seenAt < RECENTLY_SEEN_TTL_MS) {
			return
		}
		recentlySeen.set(userId, Date.now())
		AuditLogService.append(ctx, { action: 'UserAuth', userId }, { minimalGapSeconds: LOG_GAP_SECONDS })
	},

	cleanUpRecentlySeen: () => {
		const cutoff = Date.now() - RECENTLY_SEEN_TTL_MS
		for (const [userId, seenAt] of recentlySeen) {
			if (seenAt < cutoff) {
				recentlySeen.delete(userId)
			}
		}
	},
}
