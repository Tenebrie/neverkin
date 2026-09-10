import { AdminAuthenticator } from '@src/middleware/auth/AdminAuthenticator.js'
import { AllFeatureFlags, FeatureFlagService } from '@src/services/FeatureFlagService.js'
import { RedisService } from '@src/services/RedisService.js'
import { Router, useApiEndpoint, useAuth, usePathParams, useRequestBody } from 'moonflower'
import z from 'zod'

import { adminUsersTag } from './utils/tags.js'

const router = new Router().with(async (ctx) => {
	const user = await useAuth(ctx, AdminAuthenticator)
	return {
		user,
	}
})

router.get('/api/admin/feature-flags/:userId', async (ctx) => {
	useApiEndpoint({
		name: 'adminGetFeatureFlags',
		description: 'Gets the feature flags for a user',
		tags: [adminUsersTag],
	})

	const { userId } = usePathParams(ctx, {
		userId: z.string(),
	})

	return await FeatureFlagService.listUserFeatureFlags(userId)
})

router.post('/api/admin/feature-flags', async (ctx) => {
	useApiEndpoint({
		name: 'adminSetFeatureFlag',
		description: 'Sets a feature flag for a user or globally',
		tags: [adminUsersTag],
	})

	const { flag, userId, enable } = useRequestBody(ctx, {
		flag: z.enum(AllFeatureFlags),
		userId: z.string(),
		enable: z.boolean(),
	})

	if (enable) {
		await FeatureFlagService.createForUser({ flag, userId })
	} else {
		await FeatureFlagService.removeForUser({ flag, userId })
	}
	const currentFlags = await FeatureFlagService.listUserFeatureFlags(userId)
	RedisService.notifyAboutFeatureFlags({ userId, flags: currentFlags })
})

export const AdminFeatureFlagRouter = router
