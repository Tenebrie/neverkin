import { UserAuthenticator } from '@src/middleware/auth/UserAuthenticator.js'
import { AuthorizationService } from '@src/services/AuthorizationService.js'
import { SearchModeShape, WorldSearchService } from '@src/services/WorldSearchService.js'
import {
	OptionalParam,
	RequiredParam,
	Router,
	useApiEndpoint,
	useAuth,
	usePathParams,
	useQueryParams,
} from 'moonflower'
import { z } from 'zod'

import { tagEntityTag, worldDetailsTag, worldSearchTag } from './utils/tags.js'

const router = new Router()

export const SearchModeValidator = RequiredParam<z.infer<typeof SearchModeShape>>({
	parse: SearchModeShape.parse,
})

router.get('/api/world/:worldId/search/:query', async (ctx) => {
	useApiEndpoint({
		name: 'searchWorld',
		description: 'Searches all eligible world entities.',
		tags: [worldSearchTag, worldDetailsTag, tagEntityTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId, query } = usePathParams(ctx, {
		worldId: z.string(),
		query: z.string(),
	})

	await AuthorizationService.checkUserReadAccessById(user, worldId)

	const { mode, minTime, maxTime } = useQueryParams(ctx, {
		mode: OptionalParam(SearchModeValidator),
		minTime: z.number().optional(),
		maxTime: z.number().optional(),
	})

	return await WorldSearchService.search({
		worldId,
		query,
		mode: mode ?? 'string_match',
		timeRange: {
			from: minTime,
			to: maxTime,
		},
		include: ['actor', 'article', 'event', 'tag'],
	})
})

export const WorldSearchRouter = router
