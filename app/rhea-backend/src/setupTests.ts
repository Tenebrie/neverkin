import { vi } from 'vitest'

import { prismaMockRef } from './mock/utils/prismaMock.js'

vi.mock('moonflower', async () => {
	return {
		__esModule: true,
		...(await vi.importActual('moonflower')),
	}
})

vi.mock('@src/services/dbClients/DatabaseClient', () => {
	return {
		__esModule: true,
		DatabaseClient: prismaMockRef.current,
		getPrismaClient: () => prismaMockRef.current,
	}
})

vi.mock('@src/services/dbClients/RedisClient', () => {
	return {
		__esModule: true,
		getRedisClient: () => ({
			connect: async () => {
				/* Empty */
			},
		}),
		openRedisChannel: () => ({
			sendMessage: () => {
				/* Empty */
			},
		}),
	}
})
