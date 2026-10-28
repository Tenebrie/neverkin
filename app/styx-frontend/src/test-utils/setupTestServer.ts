import { afterAll, afterEach, beforeAll, beforeEach } from '@rstest/core'
import { setupServer } from 'msw/node'

import {
	mockGetAnnouncements,
	mockGetWorlds,
	mockListCalendars,
	mockListCalendarTemplates,
} from '../api/mock/rheaApi.mock'

export const setupTestServer = () => {
	const server = setupServer()
	beforeAll(() => {
		server.listen({ onUnhandledRequest: 'error' })
	})
	beforeEach(() => {
		mockGetWorlds(server, {
			response: {
				ownedWorlds: [],
				contributableWorlds: [],
				visibleWorlds: [],
			},
		})

		mockGetAnnouncements(server, {
			response: [],
		})

		mockListCalendars(server, {
			response: [],
		})

		mockListCalendarTemplates(server, {
			response: {
				keys: [],
				templates: [],
			},
		})
	})
	afterEach(() => {
		server.resetHandlers()
	})
	afterAll(() => server.close())

	return server
}
