import { describe, expect, it } from '@rstest/core'
import { renderHook, waitFor } from '@testing-library/react'

import { useGetAnnouncementsQuery } from '@/api/announcementListApi'
import { mockGetAnnouncements } from '@/api/mock/rheaApi.mock'
import { renderHookWrapper } from '@/test-utils/renderHookWrapper'
import { setupTestServer } from '@/test-utils/setupTestServer'

import { globalEventBus } from './features/eventBus/eventBus'
import { store } from './store'

const server = setupTestServer()

describe('store', () => {
	it('refetches subscribed queries on Calliope reconnect, but not on the first connection', async () => {
		const mock = mockGetAnnouncements(server, { response: [] })
		const queryStatus = () => store.getState().api.queries['getAnnouncements(undefined)']?.status

		const { result } = renderHook(() => useGetAnnouncementsQuery(), { wrapper: renderHookWrapper })
		await waitFor(() => expect(result.current.isSuccess).toBe(true))
		expect(mock.invocations).toHaveLength(1)

		globalEventBus.emit('calliope/onReconnected', { isReconnect: false })
		expect(queryStatus()).toBe('fulfilled')

		globalEventBus.emit('calliope/onReconnected', { isReconnect: true })
		expect(queryStatus()).toBe('pending')
		await waitFor(() => expect(mock.invocations).toHaveLength(2))
	})
})
