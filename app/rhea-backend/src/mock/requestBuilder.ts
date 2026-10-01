import { CollaboratingUser, User, World } from '@prisma/client'
import { AuthorizationService } from '@src/services/AuthorizationService.js'
import request, { Response, Test } from 'supertest'
import { beforeEach, vi } from 'vitest'

import { app } from '../index.js'
import { withUserAuth } from './auth.js'
import { mockCollaboratingUser, mockUser, mockWorld } from './mock.js'
import { mockPrismaClient } from './utils/prismaMock.js'

beforeEach(() => {
	vi.restoreAllMocks()
})

export const withWorld = (world?: Partial<World>) => {
	mockPrismaClient({ world: mockWorld(world) })

	return requestBuilder
}

export const withCollaboratingUser = (data?: Partial<CollaboratingUser>) => {
	mockPrismaClient({ collaboratingUser: mockCollaboratingUser(data) })

	return requestBuilder
}

export const withWorldReadAccess = (mockedUser?: Partial<User>, mockedWorld?: Partial<World>) => {
	vi.spyOn(AuthorizationService, 'checkUserReadAccessById').mockImplementation(async (user, worldId) => {
		if (user?.id === mockUser(mockedUser).id && worldId === mockWorld(mockedWorld).id) {
			return
		}
		throw new Error('Unauthorized')
	})

	return requestBuilder
}

export const withWorldWriteAccess = (mockedUser?: Partial<User>, mockedWorld?: Partial<World>) => {
	vi.spyOn(AuthorizationService, 'checkUserReadAccessById').mockImplementation(async (user, worldId) => {
		if (user?.id === mockUser(mockedUser).id && worldId === mockWorld(mockedWorld).id) {
			return
		}
		throw new Error('Unauthorized')
	})
	vi.spyOn(AuthorizationService, 'checkUserWriteAccessById').mockImplementation(async (user, worldId) => {
		if (user?.id === mockUser(mockedUser).id && worldId === mockWorld(mockedWorld).id) {
			return
		}
		throw new Error('Unauthorized')
	})

	return requestBuilder
}

export const requestBuilder = {
	get: sendGet,
	post: sendPost,
	patch: sendPatch,
	delete: sendDelete,
	withWorld,
	withCollaboratingUser,
	withUserAuth,
	withWorldReadAccess,
	withWorldWriteAccess,
}

export function makeRequest() {
	return request(app.callback())
}
export function sendGet(...args: Parameters<ReturnType<typeof request>['get']>) {
	return lazyRequest(() => makeRequest().get(...args))
}
export function sendPost(...args: Parameters<ReturnType<typeof request>['post']>) {
	return lazyRequest(() => makeRequest().post(...args))
}
export function sendPatch(...args: Parameters<ReturnType<typeof request>['patch']>) {
	return lazyRequest(() => makeRequest().patch(...args))
}
export function sendDelete(...args: Parameters<ReturnType<typeof request>['delete']>) {
	return lazyRequest(() => makeRequest().delete(...args))
}

function lazyRequest(make: () => Test) {
	return {
		send: (body: string | object) => make().send(body),
		set: (field: string, value: string) => make().set(field, value),
		query: (value: string | object) => make().query(value),
		then: (onFulfilled: (value: Response) => void, onRejected: (error: Error) => void) =>
			make().then(onFulfilled, onRejected),
	}
}
