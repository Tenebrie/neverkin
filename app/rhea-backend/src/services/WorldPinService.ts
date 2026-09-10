import { getPrismaClient } from '@src/services/dbClients/DatabaseClient.js'

export const WorldPinService = {
	toggleWorldPin: async (params: { worldId: string; userId: string }) => {
		return await getPrismaClient().$transaction(async (dbClient) => {
			const existingPin = await dbClient.userWorldPin.findUnique({
				where: { userId_worldId: params },
			})

			if (existingPin) {
				await dbClient.userWorldPin.delete({
					where: { userId_worldId: params },
				})
				await dbClient.userWorldPin.updateMany({
					where: { userId: params.userId, rank: { gt: existingPin.rank } },
					data: { rank: { decrement: 2 } },
				})
				return {
					pinned: false,
					rank: 0,
				}
			}

			const pinCount = await dbClient.userWorldPin.count({
				where: { userId: params.userId },
			})
			await dbClient.userWorldPin.create({
				data: { ...params, rank: pinCount * 2 },
			})
			return {
				pinned: true,
				rank: pinCount * 2,
			}
		})
	},
}
