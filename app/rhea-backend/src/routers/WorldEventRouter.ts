import { UserAuthenticator } from '@src/middleware/auth/UserAuthenticator.js'
import { SessionMiddleware } from '@src/middleware/SessionMiddleware.js'
import { AuthorizationService } from '@src/services/AuthorizationService.js'
import { RedisService } from '@src/services/RedisService.js'
import { RichTextService } from '@src/services/RichTextService.js'
import { ValidationService } from '@src/services/ValidationService.js'
import { WorldEventDeltaService } from '@src/services/WorldEventDeltaService.js'
import { WorldEventService } from '@src/services/WorldEventService.js'
import {
	BadRequestError,
	BooleanValidator,
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

import { worldDetailsTag, worldEventDeltaTag, worldEventTag } from './utils/tags.js'
import { ContentStringValidator } from './validators/ContentStringValidator.js'
import { NullableEventTrackValidator } from './validators/NullableEventTrackValidator.js'
import { NullableNameStringValidator } from './validators/NullableNameStringValidator.js'
import { OptionalNameStringValidator } from './validators/OptionalNameStringValidator.js'
import { OptionalURLStringValidator } from './validators/OptionalURLStringValidator.js'
import { NullableTimestampValidator, TimestampValidator } from './validators/TimestampValidator.js'
import { UuidStringValidator } from './validators/UuidStringValidator.js'

const router = new Router().with(SessionMiddleware)

/**
 * World events
 */
router.post('/api/world/:worldId/event', async (ctx) => {
	useApiEndpoint({
		name: 'createWorldEvent',
		description: 'Creates a new world event.',
		tags: [worldEventTag, worldDetailsTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)

	const params = useRequestBody(ctx, {
		id: OptionalParam(UuidStringValidator),
		name: RequiredParam(OptionalNameStringValidator),
		icon: OptionalParam(OptionalNameStringValidator),
		color: OptionalParam(OptionalNameStringValidator),
		contentRich: RequiredParam(ContentStringValidator),
		timestamp: RequiredParam(TimestampValidator),
		revokedAt: OptionalParam(NullableTimestampValidator),
		customName: OptionalParam(BooleanValidator),
		externalLink: OptionalParam(ContentStringValidator),
		worldEventTrackId: OptionalParam(NullableEventTrackValidator),
		parentFolderId: z.string().nullable().optional(),
	})

	const documentContent = await RichTextService.parseContentString({
		worldId,
		contentString: params.contentRich,
	})

	const { event, world } = await WorldEventService.createWorldEvent({
		worldId,
		createData: {
			id: params.id,
			name: params.name,
			timestamp: params.timestamp,
			parentFolderId: params.parentFolderId,
		},
		updateData: {
			...params,
			content: documentContent.content,
			contentRich: documentContent.contentRich,
			mentions: documentContent.mentions,
		},
	})

	RedisService.notifyAboutWorldUpdate(ctx, { worldId, timestamp: world.updatedAt })

	return event
})

router.patch('/api/world/:worldId/event/:eventId', async (ctx) => {
	useApiEndpoint({
		name: 'updateWorldEvent',
		description: 'Updates the target world event',
		tags: [worldEventTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId, eventId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		eventId: PathParam(StringValidator),
	})

	const params = useRequestBody(ctx, {
		name: OptionalParam(OptionalNameStringValidator),
		icon: OptionalParam(OptionalNameStringValidator),
		color: OptionalParam(OptionalNameStringValidator),
		timestamp: OptionalParam(TimestampValidator),
		revokedAt: OptionalParam(NullableTimestampValidator),
		externalLink: OptionalParam(OptionalURLStringValidator),
		worldEventTrackId: OptionalParam(NullableEventTrackValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)

	const baseEvent = await WorldEventService.fetchWorldEvent(eventId)

	const mappedParams = {
		name: params.name ?? baseEvent.name,
		icon: params.icon,
		color: params.color,
		timestamp: params.timestamp,
		revokedAt: params.revokedAt,
		externalLink: params.externalLink,
		worldEventTrackId: params.worldEventTrackId,
	}

	await ValidationService.checkEventPatchValidity(eventId, mappedParams)

	const { event } = await WorldEventService.updateWorldEvent({
		worldId,
		eventId,
		params: mappedParams,
	})

	RedisService.notifyAboutWorldEventUpdate(ctx, { worldId, event })

	return event
})

router.delete('/api/world/:worldId/event/:eventId', async (ctx) => {
	useApiEndpoint({
		name: 'deleteWorldEvent',
		description: 'Deletes the target world event.',
		tags: [worldEventTag, worldDetailsTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId, eventId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		eventId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)
	await ValidationService.checkEventValidity(eventId)

	const { event, world } = await WorldEventService.deleteWorldEvent({ worldId, eventId })

	RedisService.notifyAboutWorldUpdate(ctx, { worldId, timestamp: world.updatedAt })

	return event
})

router.post('/api/world/:worldId/event/:eventId/revoke', async (ctx) => {
	useApiEndpoint({
		name: 'revokeWorldEvent',
		description: 'Marks the specified event as revoked at specified timestamp.',
		tags: [worldEventTag, worldDetailsTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId, eventId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		eventId: PathParam(StringValidator),
	})

	const { revokedAt } = useRequestBody(ctx, {
		revokedAt: RequiredParam(TimestampValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)
	await ValidationService.checkEventValidity(eventId)
	await ValidationService.checkIfEventIsRevokableAt(eventId, revokedAt)

	const { statement, world } = await WorldEventService.revokeWorldEvent({
		worldId,
		eventId,
		revokedAt,
	})

	RedisService.notifyAboutWorldUpdate(ctx, { worldId, timestamp: world.updatedAt })

	return statement
})

router.post('/api/world/:worldId/event/:eventId/unrevoke', async (ctx) => {
	useApiEndpoint({
		name: 'unrevokeWorldEvent',
		description: 'Marks the event as never revoked.',
		tags: [worldEventTag, worldDetailsTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId, eventId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		eventId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)
	await ValidationService.checkEventValidity(eventId)

	const { statement, world } = await WorldEventService.unrevokeWorldEvent({
		worldId,
		eventId,
	})

	RedisService.notifyAboutWorldUpdate(ctx, { worldId, timestamp: world.updatedAt })

	return statement
})

/**
 * World event delta
 */
router.post('/api/world/:worldId/event/:eventId/delta', async (ctx) => {
	useApiEndpoint({
		name: 'createWorldEventDelta',
		description: 'Creates a new delta state for given event.',
		tags: [worldEventDeltaTag, worldEventTag, worldDetailsTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId, eventId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		eventId: PathParam(StringValidator),
	})

	const params = useRequestBody(ctx, {
		timestamp: RequiredParam(TimestampValidator),
		name: RequiredParam(NullableNameStringValidator),
		description: RequiredParam(NullableNameStringValidator),
		descriptionRich: RequiredParam(NullableNameStringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)
	await ValidationService.checkIfEventDeltaStateIsCreatableAt(eventId, params.timestamp)

	const { deltaState, world } = await WorldEventDeltaService.createEventDeltaState({
		worldId,
		eventId,
		data: params,
	})

	RedisService.notifyAboutWorldUpdate(ctx, { worldId, timestamp: world.updatedAt })

	return deltaState
})

router.patch('/api/world/:worldId/event/:eventId/delta/:deltaId', async (ctx) => {
	useApiEndpoint({
		name: 'updateWorldEventDelta',
		description: 'Updates the target world event delta state',
		tags: [worldEventDeltaTag, worldEventTag, worldDetailsTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId, eventId, deltaId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		eventId: PathParam(StringValidator),
		deltaId: PathParam(StringValidator),
	})

	const params = useRequestBody(ctx, {
		timestamp: OptionalParam(TimestampValidator),
		name: OptionalParam(NullableNameStringValidator),
		description: OptionalParam(NullableNameStringValidator),
		descriptionRich: OptionalParam(NullableNameStringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)
	await ValidationService.checkEventValidity(eventId)
	await ValidationService.checkEventDeltaStateValidity(deltaId)
	if (params.timestamp !== undefined) {
		await ValidationService.checkIfEventDeltaStateIsCreatableAt(eventId, params.timestamp, [deltaId])
	}

	const { deltaState } = await WorldEventDeltaService.updateEventDeltaState({
		worldId,
		deltaId,
		params: {
			timestamp: params.timestamp,
			name: params.name,
			description: params.description,
			descriptionRich: params.descriptionRich,
		},
	})

	RedisService.notifyAboutWorldEventDeltaUpdate(ctx, { worldId, delta: deltaState })

	return deltaState
})

router.delete('/api/world/:worldId/event/:eventId/delta/:deltaId', async (ctx) => {
	useApiEndpoint({
		name: 'deleteWorldEventDelta',
		description: 'Deletes the target world event delta state.',
		tags: [worldEventDeltaTag, worldEventTag, worldDetailsTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId, eventId, deltaId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		eventId: PathParam(StringValidator),
		deltaId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWriteAccessById(user, worldId)
	await ValidationService.checkEventValidity(eventId)
	await ValidationService.checkEventDeltaStateValidity(deltaId)

	const { deltaState, world } = await WorldEventDeltaService.deleteEventDeltaState({ worldId, deltaId })

	RedisService.notifyAboutWorldUpdate(ctx, { worldId, timestamp: world.updatedAt })

	return deltaState
})

router.get('/api/world/:worldId/event/:eventId/backlinks', async (ctx) => {
	useApiEndpoint({
		name: 'getWorldEventBacklinks',
		description: 'Fetches the list of entities that mention the specified world event.',
		tags: [worldEventTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId, eventId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		eventId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserReadAccessById(user, worldId)

	const backlinks = await WorldEventService.findEventBacklinks({ worldId, eventId })
	if (!backlinks) {
		throw new BadRequestError('Event not found')
	}

	return backlinks
})

export const WorldEventRouter = router
