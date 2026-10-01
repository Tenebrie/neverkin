import type { User } from '@prisma/client'
import * as moonflower from 'moonflower'
import { beforeEach, vi } from 'vitest'

import { mockUser } from './mock.js'
import { requestBuilder } from './requestBuilder.js'

export const withUserAuth = (user?: Partial<User>) => {
	vi.spyOn(moonflower, 'useAuth').mockImplementation(async () => {
		return mockUser({
			...user,
			level: 'Free',
		})
	})
	vi.spyOn(moonflower, 'useOptionalAuth').mockImplementation(async () => {
		return mockUser({
			...user,
			level: 'Free',
		})
	})

	beforeEach(() => {
		vi.spyOn(moonflower, 'useAuth').mockImplementation(async () => {
			return mockUser({
				...user,
				level: 'Free',
			})
		})
		vi.spyOn(moonflower, 'useOptionalAuth').mockImplementation(async () => {
			return mockUser({
				...user,
				level: 'Free',
			})
		})
	})

	return requestBuilder
}

export const withAdminAuth = (user?: Partial<User>) => {
	vi.spyOn(moonflower, 'useAuth').mockImplementation(async () => {
		return mockUser({
			...user,
			level: 'Admin',
		})
	})
	vi.spyOn(moonflower, 'useOptionalAuth').mockImplementation(async () => {
		return mockUser({
			...user,
			level: 'Admin',
		})
	})
	beforeEach(() => {
		vi.spyOn(moonflower, 'useAuth').mockImplementation(async () => {
			return mockUser({
				...user,
				level: 'Admin',
			})
		})
		vi.spyOn(moonflower, 'useOptionalAuth').mockImplementation(async () => {
			return mockUser({
				...user,
				level: 'Admin',
			})
		})
	})

	return requestBuilder
}
