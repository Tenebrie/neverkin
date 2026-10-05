import { UserAuthenticator } from '@src/middleware/auth/UserAuthenticator.js'
import { AuthorizationService } from '@src/services/AuthorizationService.js'
import { MentionData } from '@src/services/MentionsService.js'
import { RedisService } from '@src/services/RedisService.js'
import { RichTextService } from '@src/services/RichTextService.js'
import { WikiArticleService } from '@src/services/WikiArticleService.js'
import {
	BadRequestError,
	NumberValidator,
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
import { worldWikiArticleTag, worldWikiTag } from './utils/tags.js'
import { ContentStringValidator } from './validators/ContentStringValidator.js'
import { NullableStringValidator } from './validators/NullableStringValidator.js'

const router = new Router().with(SessionMiddleware)

router.get('/api/world/:worldId/wiki/articles', async (ctx) => {
	useApiEndpoint({
		name: 'getArticles',
		description: 'Returns a list of articles in the wiki without content.',
		tags: [worldWikiTag, worldWikiArticleTag],
	})

	const user = await useOptionalAuth(ctx, UserAuthenticator)

	const { worldId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserReadAccessById(user, worldId)

	return await WikiArticleService.listWikiArticles({ worldId })
})

router.post('/api/world/:worldId/wiki/articles', async (ctx) => {
	useApiEndpoint({
		name: 'createArticle',
		description: 'Creates a new article in the wiki.',
		tags: [worldWikiTag, worldWikiArticleTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)

	const { name, icon, color, contentRich, parentFolderId } = useRequestBody(ctx, {
		name: RequiredParam(StringValidator),
		icon: z.string().optional(),
		color: z.string().optional(),
		contentRich: OptionalParam(ContentStringValidator),
		parentFolderId: z.string().nullable().optional(),
	})

	let parsedContent: string | undefined
	let parsedContentRich: string | undefined
	let mentions: MentionData[] | undefined
	if (contentRich) {
		const parsed = await RichTextService.parseContentString({
			worldId,
			contentString: contentRich,
		})
		parsedContent = parsed.content
		parsedContentRich = contentRich
		mentions = parsed.mentions
	}

	const article = await WikiArticleService.createWikiArticle({
		worldId,
		name,
		icon,
		color,
		content: parsedContent ?? '',
		contentRich: parsedContentRich ?? '',
		mentions,
		parentFolderId: parentFolderId ?? null,
	})

	RedisService.notifyAboutWikiArticleUpdate(ctx, { worldId, article })

	return article
})

router.patch('/api/world/:worldId/wiki/article/:articleId', async (ctx) => {
	useApiEndpoint({
		name: 'updateArticle',
		description: 'Updates an article in the wiki.',
		tags: [worldWikiArticleTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId, articleId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		articleId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)

	const { name, color } = useRequestBody(ctx, {
		name: OptionalParam(StringValidator),
		icon: OptionalParam(StringValidator),
		color: OptionalParam(StringValidator),
	})

	const { article } = await WikiArticleService.updateWikiArticle({
		id: articleId,
		worldId,
		name,
		color,
	})

	RedisService.notifyAboutWikiArticleUpdate(ctx, { worldId, article })

	return article
})

router.post('/api/world/:worldId/wiki/move', async (ctx) => {
	useApiEndpoint({
		name: 'moveWikiEntity',
		description: 'Moves an entity to a new wiki position.',
		tags: [worldWikiTag, worldWikiArticleTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)

	const { entityId, parentId, position } = useRequestBody(ctx, {
		entityId: RequiredParam(StringValidator),
		parentId: OptionalParam(NullableStringValidator),
		position: RequiredParam(NumberValidator),
	})

	const { updates } = await WikiArticleService.moveWikiArticle({
		worldId,
		entityId,
		toPosition: position,
		toParentId: parentId,
	})

	RedisService.notifyAboutWikiReorder(ctx, { worldId, updates })
	return {
		updates,
	}
})

router.post('/api/world/:worldId/wiki/bulk/move', async (ctx) => {
	useApiEndpoint({
		name: 'bulkMoveWikiEntities',
		description: 'Moves a number of entities to a new wiki position.',
		tags: [worldWikiTag, worldWikiArticleTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)

	const { entityIds, parentId, position } = useRequestBody(ctx, {
		entityIds: z.string().array(),
		parentId: OptionalParam(NullableStringValidator),
		position: RequiredParam(NumberValidator),
	})

	const { updates } = await WikiArticleService.bulkMoveWikiEntities({
		worldId,
		entityIds,
		toPosition: position,
		toParentId: parentId,
	})

	RedisService.notifyAboutWikiReorder(ctx, { worldId, updates })
	return {
		updates,
	}
})

router.delete('/api/world/:worldId/wiki/article/:articleId', async (ctx) => {
	useApiEndpoint({
		name: 'deleteArticle',
		description: 'Deletes an article from the wiki.',
		tags: [worldWikiTag, worldWikiArticleTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId, articleId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		articleId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)

	const { updatedMentions } = await WikiArticleService.deleteWikiArticle({ worldId, articleId })

	RedisService.notifyAboutWikiArticlesDelete(ctx, { worldId })
	RedisService.notifyAboutUpdatedMentions(ctx, { worldId, mentions: updatedMentions })
})

router.get('/api/world/:worldId/wiki/article/:articleId/backlinks', async (ctx) => {
	useApiEndpoint({
		name: 'getArticleBacklinks',
		description: 'Fetches the list of entities that mention the specified wiki article.',
		tags: [worldWikiArticleTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId, articleId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		articleId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserReadAccessById(user, worldId)

	const backlinks = await WikiArticleService.findArticleBacklinks({ worldId, articleId })
	if (!backlinks) {
		throw new BadRequestError('Article not found')
	}

	return backlinks
})

export const WorldWikiArticleRouter = router
