import { User } from '@prisma/client'
import { BadRequestError } from 'moonflower'

import { WorldShareLinkUncheckedCreateInput } from '../../prisma/client/models.js'
import { AuthorizationService } from './AuthorizationService.js'
import { getPrismaClient } from './dbClients/DatabaseClient.js'

export const WorldShareService = {
	listCollaborators: async ({ worldId }: { worldId: string }) => {
		return getPrismaClient().collaboratingUser.findMany({
			where: {
				worldId,
			},
			select: {
				user: {
					select: {
						id: true,
						email: true,
					},
				},
				worldId: true,
				access: true,
			},
		})
	},

	removeCollaborator: async ({ worldId, userId }: { worldId: string; userId: string }) => {
		const world = await getPrismaClient().world.findFirst({
			where: {
				id: worldId,
			},
		})

		if (!world) {
			throw new BadRequestError(`Unable to find world.`)
		}

		await getPrismaClient().collaboratingUser.delete({
			where: {
				userId_worldId: {
					userId,
					worldId,
				},
			},
		})
	},

	validateLinkBySlug: async (slug: string, currentUser: User | undefined) => {
		const link = await getPrismaClient().worldShareLink.findFirst({
			where: {
				slug,
				OR: [
					{
						expiresAt: {
							gt: new Date(),
						},
					},
					{
						expiresAt: null,
					},
				],
			},
			select: {
				accessMode: true,
				world: true,
			},
		})

		if (!link) {
			throw new BadRequestError('Invalid or expired share link.')
		}

		if (currentUser) {
			const accessLevel = await AuthorizationService.getUserAccessLevel(currentUser, link.world)
			if (
				(link.accessMode === 'ReadOnly' && accessLevel.read) ||
				(link.accessMode === 'Editing' && accessLevel.write)
			) {
				return {
					world: {
						id: link.world.id,
						name: link.world.name,
						description: link.world.description,
					},
					linkAccess: link.accessMode,
					alreadyHasAccess: true,
				}
			}
		}

		return {
			world: {
				id: link.world.id,
				name: link.world.name,
				description: link.world.description,
			},
			linkAccess: link.accessMode,
			alreadyHasAccess: false,
		}
	},

	acceptLinkBySlug: async ({ slug, user }: { slug: string; user: User }) => {
		const link = await WorldShareService.validateLinkBySlug(slug, user)
		if (link.alreadyHasAccess) {
			return link
		}

		const worldId = link.world.id

		await getPrismaClient().$transaction(async (dbClient) => {
			await dbClient.collaboratingUser.deleteMany({
				where: {
					userId: user.id,
					worldId,
				},
			})
			await dbClient.collaboratingUser.create({
				data: {
					userId: user.id,
					worldId,
					access: link.linkAccess,
				},
			})
			await dbClient.worldShareLink.update({
				where: {
					slug,
				},
				data: {
					usageCount: {
						increment: 1,
					},
				},
			})
		})

		return link
	},

	generateRandomSlug: async ({ preferredSlug }: { preferredSlug?: string }) => {
		if (preferredSlug) {
			const existingLink = await getPrismaClient().worldShareLink.findFirst({
				where: {
					slug: preferredSlug,
				},
			})
			if (!existingLink) {
				return {
					slug: preferredSlug,
					preferredSlugFree: true,
				}
			}
		}

		const maxIterations = 10
		for (let i = 0; i < maxIterations; i++) {
			const slug = Math.random().toString(36).slice(2, 10)

			const existingLink = await getPrismaClient().worldShareLink.findFirst({
				where: {
					slug,
				},
			})

			if (!existingLink) {
				return {
					slug,
					preferredSlugFree: false,
				}
			}
		}
		throw new BadRequestError('Unable to generate a unique slug for the share link. Please try again.')
	},

	listShareLinks: async (worldId: string) => {
		return getPrismaClient().worldShareLink.findMany({
			where: {
				worldId,
			},
			select: {
				id: true,
				worldId: true,
				slug: true,
				label: true,
				expiresAt: true,
				accessMode: true,
				createdAt: true,
				usageCount: true,
			},
		})
	},

	createShareLink: async ({
		worldId,
		body,
	}: {
		worldId: string
		body: Omit<WorldShareLinkUncheckedCreateInput, 'slug' | 'worldId'> & { slug?: string }
	}) => {
		const slug = body.slug ?? crypto.randomUUID()

		const shareLink = await getPrismaClient().worldShareLink.create({
			data: {
				...body,
				worldId,
				slug,
			},
		})

		return shareLink
	},

	revokeShareLink: async (shareLinkId: string) => {
		await getPrismaClient().worldShareLink.update({
			where: {
				id: shareLinkId,
			},
			data: {
				expiresAt: new Date(),
			},
		})
	},

	deleteShareLink: async (shareLinkId: string) => {
		await getPrismaClient().worldShareLink.delete({
			where: {
				id: shareLinkId,
			},
		})
	},
}
