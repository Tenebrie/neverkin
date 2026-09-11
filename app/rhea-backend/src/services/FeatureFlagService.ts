import { getPrismaClient } from './dbClients/DatabaseClient.js'

export const AllFeatureFlags = ['GlobalSearch', 'MindmapRework'] as const
type FeatureFlag = (typeof AllFeatureFlags)[number]

export const FeatureFlagService = {
	listUserFeatureFlags: async (userId: string) => {
		const flags = await getPrismaClient().featureFlagEntry.findMany({
			where: {
				OR: [{ userId }, { userId: null }],
			},
			select: {
				flag: true,
			},
		})
		return flags.map((entry) => entry.flag)
	},

	createForUser: async ({ flag, userId }: { flag: FeatureFlag; userId: string }) => {
		const existingEntry = await getPrismaClient().featureFlagEntry.findFirst({
			where: {
				flag,
				userId,
			},
		})

		if (existingEntry) {
			return existingEntry
		}

		return getPrismaClient().featureFlagEntry.create({
			data: {
				flag,
				userId,
			},
		})
	},

	removeForUser: async ({ flag, userId }: { flag: FeatureFlag; userId: string }) => {
		await getPrismaClient().featureFlagEntry.deleteMany({
			where: {
				flag,
				userId,
			},
		})
	},
}
