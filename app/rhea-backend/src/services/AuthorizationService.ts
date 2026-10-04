import { Prisma, User, World } from '@prisma/client'
import { UnauthorizedError } from 'moonflower/errors/UserFacingErrors'

import { getPrismaClient } from './dbClients/DatabaseClient.js'
import { WorldEntityType } from './types.js'
import { WorldService } from './WorldService.js'

export const AuthorizationService = {
	checkUserReadAccess: async (user: User | undefined, world: World) => {
		if (world.accessMode === 'PublicRead' || world.accessMode === 'PublicEdit') {
			return
		}

		if (!user) {
			throw new UnauthorizedError('No access to this world')
		}

		if (user.id === world.ownerId) {
			return
		}

		const worldWithCollaboratorsCount = await getPrismaClient().world.count({
			where: {
				id: world.id,
				collaborators: {
					some: {
						userId: user.id,
					},
				},
			},
		})
		if (!worldWithCollaboratorsCount) {
			throw new UnauthorizedError('No access to this world')
		}
	},

	checkUserWriteAccess: async (user: User | undefined, world: World) => {
		if (!user) {
			throw new UnauthorizedError('No access to this world')
		}

		if (user.id === world.ownerId || world.accessMode === 'PublicEdit') {
			return
		}

		const worldWithCollaboratorsCount = await getPrismaClient().world.count({
			where: {
				id: world.id,
				collaborators: {
					some: {
						userId: user.id,
						access: 'Editing',
					},
				},
			},
		})
		if (!worldWithCollaboratorsCount) {
			throw new UnauthorizedError('No access to this world')
		}
	},

	checkUserReadAccessById: async (user: User | undefined, worldId: string) => {
		const worldBrief = await WorldService.findWorldBrief(worldId)
		await AuthorizationService.checkUserReadAccess(user, worldBrief)
	},

	checkUserWriteAccessById: async (user: User | undefined, worldId: string) => {
		const worldBrief = await WorldService.findWorldBrief(worldId)
		await AuthorizationService.checkUserWriteAccess(user, worldBrief)
	},

	checkUserCalendarReadAccessById: async (user: User, calendarId: string) => {
		const calendar = await getPrismaClient().calendar.findUniqueOrThrow({
			where: { id: calendarId },
		})
		if (calendar.worldId) {
			await AuthorizationService.checkUserReadAccessById(user, calendar.worldId)
		} else if (calendar.ownerId !== user.id) {
			throw new UnauthorizedError('No access to this calendar')
		}
	},

	checkUserCalendarWriteAccessById: async (user: User, calendarId: string) => {
		const calendar = await getPrismaClient().calendar.findUniqueOrThrow({
			where: { id: calendarId },
		})
		if (calendar.worldId) {
			await AuthorizationService.checkUserWriteAccessById(user, calendar.worldId)
		} else if (calendar.ownerId !== user.id) {
			throw new UnauthorizedError('No access to this calendar')
		}
	},

	checkUserWorldOwner: async (user: User, worldId: string) => {
		const count = await getPrismaClient().world.count({
			where: {
				id: worldId,
				owner: user,
			},
		})
		if (!count) {
			throw new UnauthorizedError('No access to this world')
		}
	},

	getUserAccessLevel: async (user: User, world: World) => {
		try {
			await AuthorizationService.checkUserWorldOwner(user, world.id)
			return {
				owner: true,
				write: true,
				read: true,
			}
		} catch {}
		try {
			await AuthorizationService.checkUserWriteAccess(user, world)
			return {
				owner: false,
				write: true,
				read: true,
			}
		} catch {}
		try {
			await AuthorizationService.checkUserReadAccess(user, world)
			return {
				owner: false,
				write: false,
				read: true,
			}
		} catch {}
		return {
			owner: false,
			write: false,
			read: false,
		}
	},

	checkUserAnnouncementAccess: async (user: User, announcementId: string) => {
		const count = await getPrismaClient().userAnnouncement.count({
			where: {
				id: announcementId,
				user,
			},
		})
		if (!count) {
			throw new UnauthorizedError('No access to this announcement')
		}
	},

	canUserEditWorld: async (
		world: Awaited<ReturnType<typeof WorldService.findWorldDetails>>,
		user: User | undefined,
	) => {
		if (!user) {
			return false
		}

		if (world.accessMode === 'PublicEdit' || world.ownerId === user.id) {
			return true
		}

		const collaboratingUser = await getPrismaClient().collaboratingUser.findFirst({
			where: {
				userId: user.id,
				worldId: world.id,
				access: 'Editing',
			},
			select: {
				access: true,
			},
		})
		if (collaboratingUser) {
			return true
		}
		return false
	},

	checkUserAssetOwner: async (user: User, assetId: string) => {
		const count = await getPrismaClient().asset.count({
			where: {
				id: assetId,
				ownerId: user.id,
			},
		})
		if (!count) {
			throw new UnauthorizedError('No access to this asset')
		}
	},

	checkUserAssetReadAccess: async (user: User, assetId: string) => {
		const owned = await getPrismaClient().asset.count({
			where: { id: assetId, ownerId: user.id },
		})
		if (owned) {
			return
		}

		const refs = await getPrismaClient().assetReference.findMany({
			where: { assetId },
			distinct: ['worldId'],
			select: { world: true },
		})

		for (const { world } of refs) {
			try {
				await AuthorizationService.checkUserReadAccess(user, world)
				return
			} catch (e) {
				if (!(e instanceof UnauthorizedError)) {
					throw e
				}
			}
		}

		throw new UnauthorizedError('No access to this asset')
	},

	checkEntityWorldOwnership: async ({
		worldId,
		entityId,
		entityType,
	}: {
		worldId: string
		entityId: string
		entityType: WorldEntityType
	}) => {
		if (entityType === 'actor') {
			const count = await getPrismaClient().actor.count({
				where: {
					id: entityId,
					worldId,
				},
			})
			if (!count) {
				throw new UnauthorizedError('No access to this actor')
			}
		} else if (entityType === 'article') {
			const count = await getPrismaClient().wikiArticle.count({
				where: {
					id: entityId,
					worldId,
				},
			})
			if (!count) {
				throw new UnauthorizedError('No access to this article')
			}
		} else if (entityType === 'event') {
			const count = await getPrismaClient().worldEvent.count({
				where: {
					id: entityId,
					worldId,
				},
			})
			if (!count) {
				throw new UnauthorizedError('No access to this event')
			}
		} else if (entityType === 'folder') {
			const count = await getPrismaClient().wikiFolder.count({
				where: {
					id: entityId,
					worldId,
				},
			})
			if (!count) {
				throw new UnauthorizedError('No access to this folder')
			}
		} else if (entityType === 'node') {
			const count = await getPrismaClient().mindmapNode.count({
				where: {
					id: entityId,
					worldId,
				},
			})
			if (!count) {
				throw new UnauthorizedError('No access to this node')
			}
		} else if (entityType === 'tag') {
			const count = await getPrismaClient().tag.count({
				where: {
					id: entityId,
					worldId,
				},
			})
			if (!count) {
				throw new UnauthorizedError('No access to this tag')
			}
		} else {
			throw new UnauthorizedError('No access to this entity')
		}
	},

	checkEntitiesWorldOwnership: async (
		worldId: string,
		entities: { id: string; type: WorldEntityType }[],
		prisma?: Prisma.TransactionClient,
	) => {
		const idsOfType = (type: WorldEntityType) =>
			entities.filter((entity) => entity.type === type).map((entity) => entity.id)

		const world = await getPrismaClient(prisma).world.findUnique({
			where: { id: worldId },
			select: {
				actors: { where: { id: { in: idsOfType('actor') } }, select: { id: true } },
				articles: { where: { id: { in: idsOfType('article') } }, select: { id: true } },
				events: { where: { id: { in: idsOfType('event') } }, select: { id: true } },
				folders: { where: { id: { in: idsOfType('folder') } }, select: { id: true } },
				tags: { where: { id: { in: idsOfType('tag') } }, select: { id: true } },
			},
		})
		const ownedIds = new Set(
			[world?.actors, world?.articles, world?.events, world?.folders, world?.tags]
				.flatMap((owned) => owned ?? [])
				.map((entity) => entity.id),
		)
		return new Map(entities.map((entity) => [entity.id, ownedIds.has(entity.id)]))
	},
}
