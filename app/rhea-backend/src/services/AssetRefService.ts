import { AssetReference, Prisma, ReferenceHoldingEntity } from '@prisma/client'

import { getPrismaClient } from './dbClients/DatabaseClient.js'

export const AssetRefService = {
	createReferences: async ({
		worldId,
		holderId,
		holderType,
		assets,
		pageId,
		prisma,
	}: {
		worldId: string
		holderId: string
		holderType: ReferenceHoldingEntity
		assets: string[] | undefined
		pageId: string | null
		prisma?: Prisma.TransactionClient
	}): Promise<AssetReference[] | undefined> => {
		if (!assets) {
			return undefined
		}

		const client = getPrismaClient(prisma)

		const holderColumn = {
			holderActorId: holderType === ReferenceHoldingEntity.Actor ? holderId : undefined,
			holderEventId: holderType === ReferenceHoldingEntity.Event ? holderId : undefined,
			holderArticleId: holderType === ReferenceHoldingEntity.Article ? holderId : undefined,
			holderTagId: holderType === ReferenceHoldingEntity.Tag ? holderId : undefined,
		}

		const data = dedupeReferences(
			assets.map((assetId) => ({
				holderId: holderId,
				holderType: holderType,

				assetId,
				worldId,

				pageId: pageId,

				...holderColumn,
			})),
		)

		await client.assetReference.deleteMany({
			where: {
				...holderColumn,
				pageId,
			},
		})

		if (data.length > 0) {
			await client.assetReference.createMany({
				data,
				skipDuplicates: true,
			})
		}

		if (assets.length > 0) {
			await client.asset.updateMany({
				where: {
					id: {
						in: assets,
					},
				},
				data: {
					expiresAt: null,
				},
			})
		}

		const allReferences = await client.assetReference.findMany({
			where: holderColumn,
		})

		return dedupeReferences(allReferences)
	},

	clearOrphanedReferences: async (transaction?: Prisma.TransactionClient) => {
		await (transaction ?? getPrismaClient()).assetReference.deleteMany({
			where: {
				holderArticleId: null,
				holderEventId: null,
				holderTagId: null,
				holderActorId: null,
				holderNodeId: null,
			},
		})
	},
}

export function dedupeReferences<T extends Pick<AssetReference, 'holderId' | 'assetId'>>(
	references: T[],
): T[] {
	const unique = new Map<string, T>()
	for (const reference of references) {
		unique.set(`${reference.holderId}->${reference.assetId}`, reference)
	}
	return Array.from(unique.values())
}
