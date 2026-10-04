import { UserAuthenticator } from '@src/middleware/auth/UserAuthenticator.js'
import { SessionMiddleware } from '@src/middleware/SessionMiddleware.js'
import { AuthorizationService } from '@src/services/AuthorizationService.js'
import { RedisService } from '@src/services/RedisService.js'
import { TagService } from '@src/services/TagService.js'
import {
	BadRequestError,
	OptionalParam,
	PathParam,
	RequiredParam,
	Router,
	StringValidator,
	useApiEndpoint,
	useAuth,
	usePathParams,
	useRequestBody,
} from 'moonflower'
import { z } from 'zod'

import { tagEntityTag, worldDetailsTag } from './utils/tags.js'
import { NameStringValidator } from './validators/NameStringValidator.js'
import { OptionalNameStringValidator } from './validators/OptionalNameStringValidator.js'

const router = new Router().with(SessionMiddleware)

router.post('/api/world/:worldId/tags', async (ctx) => {
	useApiEndpoint({
		name: 'createTag',
		description: 'Creates a new tag',
		tags: [tagEntityTag, worldDetailsTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)

	const params = useRequestBody(ctx, {
		name: RequiredParam(NameStringValidator),
		description: OptionalParam(OptionalNameStringValidator),
		parentFolderId: z.string().nullable().optional(),
	})

	const { tag, world } = await TagService.createTag({
		worldId,
		params,
	})

	RedisService.notifyAboutWorldUpdate(ctx, { worldId, timestamp: world.updatedAt })

	return tag
})

router.patch('/api/world/:worldId/tag/:tagId', async (ctx) => {
	useApiEndpoint({
		name: 'updateTag',
		description: 'Updates the target tag',
		tags: [tagEntityTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId, tagId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		tagId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)

	const params = useRequestBody(ctx, {
		name: OptionalParam(NameStringValidator),
		description: OptionalParam(OptionalNameStringValidator),
		color: z.string().optional(),
	})

	const { tag } = await TagService.updateTag({
		worldId,
		tagId,
		params,
	})

	RedisService.notifyAboutTagUpdate(ctx, { worldId, tag })

	return tag
})

router.delete('/api/world/:worldId/tag/:tagId', async (ctx) => {
	useApiEndpoint({
		name: 'deleteTag',
		description: 'Deletes the target tag',
		tags: [tagEntityTag, worldDetailsTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId, tagId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		tagId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)

	const { tag, world } = await TagService.deleteTag({ worldId, tagId })

	RedisService.notifyAboutWorldUpdate(ctx, { worldId, timestamp: world.updatedAt })

	return tag
})

router.get('/api/world/:worldId/tag/:tagId', async (ctx) => {
	useApiEndpoint({
		name: 'getTagDetails',
		description: 'Fetches the details of a tag, including all entities that mention it',
		tags: [tagEntityTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId, tagId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		tagId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserReadAccessById(user, worldId)

	const tag = await TagService.findTagWithMentions({ worldId, tagId })
	if (!tag) {
		throw new BadRequestError('Tag not found')
	}

	return tag
})

export const TagRouter = router
