import { CollaboratingUser, PrismaClient, World } from '@prisma/client'
import { beforeEach, vi } from 'vitest'

/** What `getPrismaClient()` returns under test — a stub, or a real client a suite installs. */
export const prismaMockRef: { current: PrismaClient } = {
	current: makePrismaClient({}),
}

/** TODO: Nuke that, as there is a mock db available in test */
function makePrismaClient({
	worldCount,
	world,
	collaboratingUser,
}: {
	worldCount?: number
	world?: World
	collaboratingUser?: CollaboratingUser
}): PrismaClient {
	return {
		world: {
			count: vi.fn().mockResolvedValue(worldCount),
			findFirst: vi.fn().mockResolvedValue(world),
			findFirstOrThrow: vi.fn().mockResolvedValue(world),
		},
		collaboratingUser: {
			findFirst: vi.fn().mockResolvedValue(collaboratingUser),
			findFirstOrThrow: vi.fn().mockResolvedValue(collaboratingUser),
		},
	} as unknown as PrismaClient
}

export function mockPrismaClient({
	world,
	collaboratingUser,
}: {
	world?: World
	collaboratingUser?: CollaboratingUser
}) {
	prismaMockRef.current = makePrismaClient({ world, collaboratingUser })
}

beforeEach(() => {
	prismaMockRef.current = makePrismaClient({})
})
