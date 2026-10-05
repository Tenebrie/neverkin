import { WikiFolder } from '@prisma/client'
import { getPrismaClient } from '@src/services/dbClients/DatabaseClient.js'
import { BadRequestError } from 'moonflower'

import { makeSortWikiArticlesQuery } from './dbQueries/makeSortWikiArticlesQuery.js'
import { makeTouchWorldQuery } from './dbQueries/makeTouchWorldQuery.js'
import { CommonOrderBy } from './utils/commonOrderBy.js'
import { BulkActionService } from './WorldBulkActionService.js'

export const WikiFolderService = {
	listWikiFolders: async (params: Pick<WikiFolder, 'worldId'>) => {
		const children = {
			select: { id: true, parentFolderId: true, parentFolderPosition: true },
			orderBy: CommonOrderBy,
		}
		const folders = await getPrismaClient().wikiFolder.findMany({
			where: { worldId: params.worldId },
			include: {
				actors: children,
				articles: children,
				children: children,
				events: children,
				tags: children,
			},
			orderBy: CommonOrderBy,
		})

		return folders
	},

	createWikiFolder: async (
		params: Pick<WikiFolder, 'worldId' | 'name' | 'parentFolderId'> & {
			icon?: string
			color?: string
		},
	) => {
		return getPrismaClient().$transaction(async (prisma) => {
			const entityCount = await BulkActionService.countWikiEntities({
				worldId: params.worldId,
				folderId: params.parentFolderId,
				prisma,
			})

			const baseFolder = await prisma.wikiFolder.create({
				data: {
					worldId: params.worldId,
					name: params.name,
					icon: params.icon,
					color: params.color,
					parentFolderId: params.parentFolderId,
					parentFolderPosition: entityCount * 2,
				},
				select: {
					id: true,
				},
			})

			await makeTouchWorldQuery(params.worldId, prisma)
			await makeSortWikiArticlesQuery(params.worldId, prisma)

			const folder = await prisma.wikiFolder.findFirst({
				where: {
					id: baseFolder.id,
				},
				include: {
					actors: { select: { id: true, parentFolderId: true, parentFolderPosition: true } },
					articles: { select: { id: true, parentFolderId: true, parentFolderPosition: true } },
					children: { select: { id: true, parentFolderId: true, parentFolderPosition: true } },
					events: { select: { id: true, parentFolderId: true, parentFolderPosition: true } },
					tags: { select: { id: true, parentFolderId: true, parentFolderPosition: true } },
				},
			})

			return folder!
		})
	},

	updateWikiFolder: async (
		params: Partial<Pick<WikiFolder, 'name' | 'icon' | 'color'>> & {
			id: string
			worldId: string
		},
	) => {
		return getPrismaClient().$transaction(async (prisma) => {
			const folder = await prisma.wikiFolder.update({
				where: { id: params.id, worldId: params.worldId },
				data: {
					name: params.name,
					icon: params.icon,
					color: params.color,
				},
				include: {
					actors: { select: { id: true, parentFolderId: true, parentFolderPosition: true } },
					articles: { select: { id: true, parentFolderId: true, parentFolderPosition: true } },
					children: { select: { id: true, parentFolderId: true, parentFolderPosition: true } },
					events: { select: { id: true, parentFolderId: true, parentFolderPosition: true } },
					tags: { select: { id: true, parentFolderId: true, parentFolderPosition: true } },
				},
			})

			await makeTouchWorldQuery(params.worldId, prisma)

			return folder
		})
	},

	deleteWikiFolder: async ({ worldId, folderId }: { worldId: string; folderId: string }) => {
		const folder = await getPrismaClient().wikiFolder.findFirst({
			where: { id: folderId, worldId },
		})
		if (!folder) {
			throw new BadRequestError('Folder not found')
		}

		return getPrismaClient().$transaction(async (prisma) => {
			await prisma.wikiFolder.delete({ where: { id: folderId } })
			await makeTouchWorldQuery(worldId, prisma)
		})
	},
}
