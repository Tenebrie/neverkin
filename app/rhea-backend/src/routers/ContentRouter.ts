import { Actor, MindmapNode, WikiArticle, WorldEvent } from '@prisma/client'
import { UserAuthenticator } from '@src/middleware/auth/UserAuthenticator.js'
import { SessionMiddleware } from '@src/middleware/SessionMiddleware.js'
import { ContentEntityType, ContentEntityTypeSchema } from '@src/schema/ContentEntityType.js'
import { AuthorizationService } from '@src/services/AuthorizationService.js'
import { ContentService } from '@src/services/ContentService.js'
import { RedisService } from '@src/services/RedisService.js'
import { RichTextService } from '@src/services/RichTextService.js'
import {
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

import { actorListTag, entityContentTag, worldEventTag, worldWikiArticleTag } from './utils/tags.js'
import { ContentStringValidator } from './validators/ContentStringValidator.js'
import { NameStringValidator } from './validators/NameStringValidator.js'

const router = new Router().with(SessionMiddleware).with(async (ctx) => {
	return {
		user: await useAuth(ctx, UserAuthenticator),
	}
})

const tags = [entityContentTag, actorListTag, worldEventTag, worldWikiArticleTag]

router.get('/api/world/:worldId/:entityType/:entityId/content', async (ctx) => {
	useApiEndpoint({
		name: 'getEntityContent',
		description: 'Fetches the content of the specified entity.',
		tags,
	})

	const { worldId, entityType, entityId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		entityType: ContentEntityTypeSchema,
		entityId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserReadAccessById(ctx.user, worldId)

	const entity = await ContentService.getContent({ entityType, worldId, entityId })

	return {
		contentHtml: entity.contentRich,
	}
})

router.put('/api/world/:worldId/:entityType/:entityId/content', async (ctx) => {
	useApiEndpoint({
		name: 'putEntityContent',
		description: 'Updates the content of the specified entity.',
		tags,
	})

	const { worldId, entityType, entityId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		entityType: ContentEntityTypeSchema,
		entityId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(ctx.user, worldId)

	const { content, reloadClients } = useRequestBody(ctx, {
		content: RequiredParam(ContentStringValidator),
		reloadClients: z.boolean().optional(),
	})

	const documentContent = await RichTextService.parseContentString({ worldId, contentString: content })

	const isEqual = await RichTextService.isContentEqual({
		newContentRich: documentContent.contentRich,
		worldId,
		entityId,
		entityType,
	})
	if (isEqual) {
		return
	}

	const { entity, updatedMentions } = await ContentService.updateContent({
		entityType,
		worldId,
		entityId,
		params: documentContent,
	})

	notifyEntityUpdate(ctx, entityType, worldId, entity)
	RedisService.notifyAboutUpdatedMentions(ctx, { worldId, mentions: updatedMentions })

	if (reloadClients) {
		RedisService.notifyAboutDocumentReset(ctx, { worldId, entityId })
	}
})

router.get('/api/world/:worldId/:entityType/:entityId/content/pages/:pageId', async (ctx) => {
	useApiEndpoint({
		name: 'getEntityContentPage',
		description: 'Fetches the content of the specified content page.',
		tags,
	})

	const { worldId, entityType, entityId, pageId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		entityType: ContentEntityTypeSchema,
		entityId: PathParam(StringValidator),
		pageId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserReadAccessById(ctx.user, worldId)

	const page = await ContentService.getPage({ entityType, worldId, entityId, pageId })
	if (!page) {
		throw new Error('Page not found')
	}

	return {
		contentHtml: page.contentRich,
	}
})

router.post('/api/world/:worldId/:entityType/:entityId/content/pages', async (ctx) => {
	useApiEndpoint({
		name: 'createEntityContentPage',
		description: 'Creates a new content page for the specified entity.',
		tags,
	})

	const { worldId, entityType, entityId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		entityType: ContentEntityTypeSchema,
		entityId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(ctx.user, worldId)

	const { name } = useRequestBody(ctx, {
		name: RequiredParam(NameStringValidator),
	})

	const { entity, page } = await ContentService.createPage({ entityType, worldId, entityId, name })

	notifyEntityUpdate(ctx, entityType, worldId, entity)

	return page
})

router.put('/api/world/:worldId/:entityType/:entityId/content/pages/:pageId', async (ctx) => {
	useApiEndpoint({
		name: 'putEntityContentPage',
		description: 'Updates the content of the specified content page.',
		tags,
	})

	const { worldId, entityType, entityId, pageId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		entityType: ContentEntityTypeSchema,
		entityId: PathParam(StringValidator),
		pageId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(ctx.user, worldId)

	const { content, reloadClients } = useRequestBody(ctx, {
		content: RequiredParam(ContentStringValidator),
		reloadClients: z.boolean().optional(),
	})

	const documentContent = await RichTextService.parseContentString({ worldId, contentString: content })

	const { entity, updatedMentions } = await ContentService.updatePage({
		entityType,
		worldId,
		entityId,
		pageId,
		params: documentContent,
	})

	notifyEntityUpdate(ctx, entityType, worldId, entity)
	RedisService.notifyAboutUpdatedMentions(ctx, { worldId, mentions: updatedMentions })

	if (reloadClients) {
		RedisService.notifyAboutDocumentReset(ctx, { worldId, entityId: pageId })
	}
})

router.delete('/api/world/:worldId/:entityType/:entityId/content/pages/:pageId', async (ctx) => {
	useApiEndpoint({
		name: 'deleteEntityContentPage',
		description: 'Deletes a content page from the specified entity.',
		tags,
	})

	const { worldId, entityType, entityId, pageId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		entityType: ContentEntityTypeSchema,
		entityId: PathParam(StringValidator),
		pageId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(ctx.user, worldId)

	const { entity, updatedMentions } = await ContentService.deletePage({
		entityType,
		worldId,
		entityId,
		pageId,
	})

	notifyEntityUpdate(ctx, entityType, worldId, entity)
	RedisService.notifyAboutUpdatedMentions(ctx, { worldId, mentions: updatedMentions })
})

function notifyEntityUpdate(
	ctx: Parameters<typeof RedisService.notifyAboutActorUpdate>[0],
	entityType: ContentEntityType,
	worldId: string,
	entity: Actor | WorldEvent | WikiArticle | MindmapNode,
) {
	switch (entityType) {
		case 'actor':
			RedisService.notifyAboutActorUpdate(ctx, { worldId, actor: entity as Actor })
			return
		case 'event':
			RedisService.notifyAboutWorldEventUpdate(ctx, { worldId, event: entity as WorldEvent })
			return
		case 'article':
			RedisService.notifyAboutWikiArticleUpdate(ctx, { worldId, article: entity as WikiArticle })
			return
		case 'node':
			RedisService.notifyAboutMindmapNodesUpdate(ctx, { worldId, nodes: [entity as MindmapNode] })
			return
	}
}

export const ContentRouter = router
