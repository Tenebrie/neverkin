import { User } from '@prisma/client'

import { withUserAuth } from '../auth.js'
import { mockUser } from '../mock.js'

export function setupMockUser(data?: Partial<User>) {
	const user = mockUser(data)

	return {
		...user,
		...withUserAuth(user),
	}
}
