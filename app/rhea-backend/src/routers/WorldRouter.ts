import { UserAuthenticator } from '@src/middleware/auth/UserAuthenticator.js'
import { SessionMiddleware } from '@src/middleware/SessionMiddleware.js'
import { AuthorizationService } from '@src/services/AuthorizationService.js'
import { CalendarService } from '@src/services/CalendarService.js'
import { IconsService } from '@src/services/IconsService.js'
import { RedisService } from '@src/services/RedisService.js'
import { WorldService } from '@src/services/WorldService.js'
import { WorldShareService } from '@src/services/WorldShareService.js'
import {
	NonEmptyStringValidator,
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

import {
	calendarTag,
	worldCollaboratorsTag,
	worldCommonIconsTag,
	worldDetailsTag,
	worldListTag,
} from './utils/tags.js'
import { StringArrayValidator } from './validators/StringArrayValidator.js'
import { WorldAccessModeValidator } from './validators/WorldAccessModeValidator.js'

const router = new Router().with(SessionMiddleware)

router.get('/api/worlds', async (ctx) => {
	useApiEndpoint({
		name: 'getWorlds',
		description: 'Lists all worlds accessible for the current user.',
		tags: [worldListTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	return await WorldService.listAvailableWorlds({ owner: user })
})

router.post('/api/worlds', async (ctx) => {
	useApiEndpoint({
		name: 'createWorld',
		description: 'Creates a new world (project).',
		tags: [worldListTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const params = useRequestBody(ctx, {
		name: RequiredParam(NonEmptyStringValidator),
		description: OptionalParam(StringValidator),
		calendars: OptionalParam(StringArrayValidator),
		timeOrigin: OptionalParam(NumberValidator),
	})

	const world = await WorldService.createWorld({
		owner: user,
		...params,
		calendars: params.calendars ?? ['earth_current'],
	})

	return world
})

router.patch('/api/world/:worldId', async (ctx) => {
	useApiEndpoint({
		name: 'updateWorld',
		description: 'Updates the world information.',
		tags: [worldDetailsTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
	})

	const params = useRequestBody(ctx, {
		name: OptionalParam(NonEmptyStringValidator),
		description: OptionalParam(StringValidator),
		calendars: OptionalParam(StringArrayValidator),
		timeOrigin: OptionalParam(NumberValidator),
	})

	await AuthorizationService.checkUserWorldOwner(user, worldId)

	await WorldService.updateWorld({
		worldId,
		data: params,
	})
})

router.delete('/api/world/:worldId', async (ctx) => {
	useApiEndpoint({
		name: 'deleteWorld',
		description: 'Destroys a world owned by the current user.',
		tags: [worldListTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWorldOwner(user, worldId)

	return await WorldService.deleteWorld(worldId)
})

router.get('/api/world/:worldId', async (ctx) => {
	useApiEndpoint({
		name: 'getWorldInfo',
		description: 'Returns all information about a world.',
		tags: [worldDetailsTag],
	})

	const { worldId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
	})

	await WorldService.migrateLegacyCalendar(worldId)
	const worldDetails = await WorldService.findWorldDetails(worldId)
	const user = await useOptionalAuth(ctx, UserAuthenticator)

	await AuthorizationService.checkUserReadAccess(user, worldDetails)

	return {
		...worldDetails,
		isReadOnly: !(await AuthorizationService.canUserEditWorld(worldDetails, user)),
	}
})

router.get('/api/world/:worldId/icons/events/common', async (ctx) => {
	useApiEndpoint({
		name: 'getCommonWorldEventIcons',
		description: 'Returns commonly used event icons for a world.',
		tags: [worldDetailsTag, worldCommonIconsTag],
	})

	const { worldId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
	})

	const user = await useAuth(ctx, UserAuthenticator)
	await AuthorizationService.checkUserReadAccessById(user, worldId)

	const collections = await IconsService.getCommonWorldEventIcons(worldId)
	return { collections }
})

router.get('/api/world/:worldId/brief', async (ctx) => {
	useApiEndpoint({
		name: 'getWorldBrief',
		description: 'Returns summarized information about a world.',
		tags: [worldDetailsTag],
	})

	const { worldId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
	})

	const worldBrief = await WorldService.findWorldBrief(worldId)
	const user = await useOptionalAuth(ctx, UserAuthenticator)

	await AuthorizationService.checkUserReadAccess(user, worldBrief)

	return worldBrief
})

router.get('/api/world/:worldId/collaborators', async (ctx) => {
	useApiEndpoint({
		name: 'getWorldCollaborators',
		description: 'List the collaborating users',
		tags: [worldCollaboratorsTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWorldOwner(user, worldId)

	return await WorldShareService.listCollaborators({ worldId })
})

router.post('/api/world/:worldId/access', async (ctx) => {
	useApiEndpoint({
		name: 'setWorldAccessMode',
		description: "Changes the world's access mode.",
		tags: [worldDetailsTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
	})

	const { access } = useRequestBody(ctx, {
		access: RequiredParam(WorldAccessModeValidator),
	})

	await AuthorizationService.checkUserWorldOwner(user, worldId)

	await WorldService.updateWorld({
		worldId,
		data: {
			accessMode: access,
		},
	})
})

router.delete('/api/world/:worldId/share/:userId', async (ctx) => {
	useApiEndpoint({
		name: 'unshareWorld',
		description: "Removes the target user's access to this world.",
		tags: [worldCollaboratorsTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId, userId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
		userId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserWorldOwner(user, worldId)

	await WorldShareService.removeCollaborator({
		worldId,
		userId,
	})

	RedisService.notifyAboutWorldUnshared(ctx, {
		userId,
	})
})

/**
 * World calendars
 */
router.get('/api/world/:worldId/calendars', async (ctx) => {
	useApiEndpoint({
		name: 'listWorldCalendars',
		description: 'Lists all calendars accessible for the current user in a given world.',
		tags: [calendarTag, worldDetailsTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
	})

	await AuthorizationService.checkUserReadAccessById(user, worldId)

	const userCalendars = await CalendarService.listUserCalendars({ ownerId: user.id })
	const worldCalendars = await CalendarService.listWorldCalendars({ worldId })

	return [...userCalendars, ...worldCalendars]
})

/**
 * World unsubscribe
 */
router.post('/api/world/:worldId/collaboration/leave', async (ctx) => {
	useApiEndpoint({
		name: 'leaveWorldCollaboration',
		description: 'Removes the current user from the world collaborators.',
		tags: [worldListTag, worldDetailsTag],
	})

	const user = await useAuth(ctx, UserAuthenticator)

	const { worldId } = usePathParams(ctx, {
		worldId: PathParam(StringValidator),
	})

	return await WorldShareService.removeCollaborator({
		worldId,
		userId: user.id,
	})
})

export const WorldRouter = router
