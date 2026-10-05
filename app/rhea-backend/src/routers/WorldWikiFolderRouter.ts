import { UserAuthenticator } from '@src/middleware/auth/UserAuthenticator.js'
import { AuthorizationService } from '@src/services/AuthorizationService.js'
import { RedisService } from '@src/services/RedisService.js'
import { WikiFolderService } from '@src/services/WikiFolderService.js'
import {
	OptionalParam,
	PathParam,
	RequiredParam,
	Router,
	StringValidator,
	useApiEndpoint,
	useAuth,
	useOptionalAuth,
	usePathParams,
	useRequestBody,
} from 'moonflower'
import { z } from 'zod'

import { SessionMiddleware } from '../middleware/SessionMiddleware.js'
import { worldWikiFolderTag } from './utils/tags.js'

const router = new Router().with(SessionMiddleware)

router.get('/api/world/:worldId/wiki/folders', async (ctx) => {
	useApiEndpoint({
		name: 'getFolders',
		description: 'Returns a list of folders in the wiki without content.',
		tags: [worldWikiFolderTag],
	})

	const user = await useOptionalAuth(ctx, UserAuthenticator)

	const { worldId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserReadAccessById(user, worldId)

	return await WikiFolderService.listWikiFolders({ worldId })
})

router.post('/api/world/:worldId/wiki/folders', async (ctx) => {
	useApiEndpoint({
		name: 'createFolder',
		description: 'Creates a new folder in the wiki.',
		tags: [worldWikiFolderTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)

	const { name, icon, color, parentFolderId } = useRequestBody(ctx, {
		name: RequiredParam(StringValidator),
		icon: OptionalParam(StringValidator),
		color: OptionalParam(StringValidator),
		parentFolderId: z.string().nullable().optional(),
	})

	const folder = await WikiFolderService.createWikiFolder({
		worldId,
		name,
		icon,
		color,
		parentFolderId: parentFolderId ?? null,
	})

	RedisService.notifyAboutWikiFolderUpdate(ctx, { worldId, folder })

	return folder
})

router.patch('/api/world/:worldId/wiki/folder/:folderId', async (ctx) => {
	useApiEndpoint({
		name: 'updateFolder',
		description: 'Updates a folder in the wiki.',
		tags: [worldWikiFolderTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId, folderId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		folderId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)

	const { name, icon, color } = useRequestBody(ctx, {
		name: OptionalParam(StringValidator),
		icon: OptionalParam(StringValidator),
		color: OptionalParam(StringValidator),
	})

	const folder = await WikiFolderService.updateWikiFolder({ id: folderId, worldId, name, icon, color })

	RedisService.notifyAboutWikiFolderUpdate(ctx, { worldId, folder })

	return folder
})

router.delete('/api/world/:worldId/wiki/folder/:folderId', async (ctx) => {
	useApiEndpoint({
		name: 'deleteFolder',
		description: 'Deletes a folder from the wiki.',
		tags: [worldWikiFolderTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId, folderId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		folderId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)

	await WikiFolderService.deleteWikiFolder({ worldId, folderId })

	RedisService.notifyAboutWikiFoldersDelete(ctx, { worldId })
})

export const WorldWikiFolderRouter = router
