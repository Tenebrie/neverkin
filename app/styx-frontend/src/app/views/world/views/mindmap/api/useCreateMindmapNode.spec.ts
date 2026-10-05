import { describe, expect, it } from '@rstest/core'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { v4 as getRandomId } from 'uuid'

import { CreateNodeApiArg, CreateNodeApiResponse, mindmapApi } from '@/api/mindmapApi'
import { store } from '@/app/store'
import { renderHookWrapper } from '@/test-utils/renderHookWrapper'
import { setupMockWorld } from '@/test-utils/setupMockWorld'
import { setupTestServer } from '@/test-utils/setupTestServer'

import { useCreateMindmapNode } from './useCreateMindmapNode'

describe('useCreateMindmapNode', () => {
	const server = setupTestServer()
	const { worldId } = setupMockWorld()

	it('keeps both nodes when the first create responds after the second is sent', async () => {
		const nodeAId = getRandomId()
		const nodeBId = getRandomId()
		const releaseResponse = new Map<string, () => void>()
		server.use(
			http.post<never, CreateNodeApiArg['body'], CreateNodeApiResponse>(
				`http://fakelocalhost/api/world/${worldId}/mindmap/nodes`,
				async ({ request }) => {
					const body = await request.json()
					await new Promise<void>((resolve) => releaseResponse.set(body.id ?? '', resolve))
					return HttpResponse.json({
						id: body.id ?? '',
						worldId,
						name: '',
						content: '',
						contentRich: '',
						createdAt: '2026-10-04T12:00:00.000Z',
						updatedAt: '2026-10-04T12:00:00.000Z',
						positionX: body.positionX ?? 0,
						positionY: body.positionY ?? 0,
					})
				},
			),
		)
		await store.dispatch(mindmapApi.util.upsertQueryData('getMindmap', { worldId }, { nodes: [], wires: [] }))
		const { result } = renderHook(() => useCreateMindmapNode(), { wrapper: renderHookWrapper })
		const [createNode] = result.current

		const createA = createNode({ id: nodeAId, positionX: 0, positionY: 0 })
		const createB = createNode({ id: nodeBId, positionX: 300, positionY: 0 })
		await waitFor(() => expect(releaseResponse.size).toBe(2))
		releaseResponse.get(nodeAId)?.()
		await createA
		releaseResponse.get(nodeBId)?.()
		await createB

		const mindmapQuery = store.dispatch(mindmapApi.endpoints.getMindmap.initiate({ worldId }))
		const { data } = await mindmapQuery
		mindmapQuery.unsubscribe()
		expect(data?.nodes.map((node) => node.id)).toEqual([nodeAId, nodeBId])
	})
})
