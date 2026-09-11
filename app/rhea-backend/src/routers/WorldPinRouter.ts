import { UserAuthMiddleware } from '@src/middleware/UserAuthMiddleware.js'
import { AuthorizationService } from '@src/services/AuthorizationService.js'
import { WorldPinService } from '@src/services/WorldPinService.js'
import { Router, useApiEndpoint, usePathParams } from 'moonflower'
import { z } from 'zod'

import { worldListTag } from './utils/tags.js'

const router = new Router().with(UserAuthMiddleware)

router.post('/api/world/:worldId/pin/toggle', async (ctx) => {
	useApiEndpoint({
		name: 'toggleWorldPin',
		description: 'Toggles the pin status of a world for the current user.',
		tags: [worldListTag],
	})

	const { worldId } = usePathParams(ctx, {
		worldId: z.string(),
	})

	await AuthorizationService.checkUserReadAccessById(ctx.user, worldId)

	return await WorldPinService.toggleWorldPin({
		worldId,
		userId: ctx.user.id,
	})
})

export const WorldPinRouter = router
