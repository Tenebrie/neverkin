import { describe, expect, it } from '@rstest/core'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { v4 as getRandomId } from 'uuid'

import { CreateMindmapWiresApiArg, CreateMindmapWiresApiResponse, mindmapApi } from '@/api/mindmapApi'
import { store } from '@/app/store'
import { renderHookWrapper } from '@/test-utils/renderHookWrapper'
import { setupMockWorld } from '@/test-utils/setupMockWorld'
import { setupTestServer } from '@/test-utils/setupTestServer'

import { useCreateMindmapWires } from './useCreateMindmapWires'

describe('useCreateMindmapWires', () => {
	const server = setupTestServer()
	const { worldId } = setupMockWorld()

	it('keeps both wires when the first create responds after the second is sent', async () => {
		const nodeAId = getRandomId()
		const nodeBId = getRandomId()
		const nodeCId = getRandomId()
		const nodeDId = getRandomId()
		const wireABId = getRandomId()
		const wireCDId = getRandomId()
		const wireIdsBySource = new Map([
			[nodeAId, wireABId],
			[nodeCId, wireCDId],
		])
		const releaseResponse = new Map<string, () => void>()
		server.use(
			http.post<never, CreateMindmapWiresApiArg['body'], CreateMindmapWiresApiResponse>(
				`http://fakelocalhost/api/world/${worldId}/mindmap/wires`,
				async ({ request }) => {
					const { wires } = await request.json()
					const [{ sourceNodeId, targetNodeId }] = wires
					await new Promise<void>((resolve) => releaseResponse.set(sourceNodeId, resolve))
					return HttpResponse.json({
						created: [
							{
								id: wireIdsBySource.get(sourceNodeId) ?? '',
								createdAt: '2026-10-05T12:00:00.000Z',
								updatedAt: '2026-10-05T12:00:00.000Z',
								direction: 'Normal',
								content: '',
								sourceNodeId,
								targetNodeId,
							},
						],
						updated: [],
					})
				},
			),
		)
		await store.dispatch(mindmapApi.util.upsertQueryData('getMindmap', { worldId }, { nodes: [], wires: [] }))
		const { result } = renderHook(() => useCreateMindmapWires(), { wrapper: renderHookWrapper })
		const [createWires] = result.current

		const createAB = createWires([{ sourceNodeId: nodeAId, targetNodeId: nodeBId }])
		const createCD = createWires([{ sourceNodeId: nodeCId, targetNodeId: nodeDId }])
		await waitFor(() => expect(releaseResponse.size).toBe(2))
		releaseResponse.get(nodeAId)?.()
		await createAB
		releaseResponse.get(nodeCId)?.()
		await createCD

		const mindmapQuery = store.dispatch(mindmapApi.endpoints.getMindmap.initiate({ worldId }))
		const { data } = await mindmapQuery
		mindmapQuery.unsubscribe()
		expect(data?.wires.map((wire) => wire.id)).toEqual([wireABId, wireCDId])
	})
})
