import { MindmapLinkDirection } from '@prisma/client'
import { mockMindmapLink, mockMindmapNode, mockUser, mockWorld, withUserAuth } from '@src/mock/index.js'
import { setupMockDatabase } from '@src/mock/utils/setupMockDatabase.js'
import { beforeEach, describe, expect, it } from 'vitest'

describe('MindmapRouter', () => {
	const db = setupMockDatabase()
	const user = mockUser()
	const world = mockWorld({ ownerId: user.id })

	beforeEach(async () => {
		await db.user.createMany({ data: [user] })
		await db.world.create({ data: world })
	})

	describe('POST /api/world/:worldId/mindmap/nodes', () => {
		const api = withUserAuth(user).post(`/api/world/${world.id}/mindmap/nodes`)

		it('creates a node for the world owner', async () => {
			const response = await api.send({
				name: 'Test node',
				positionX: 10,
				positionY: 20,
			})

			expect(response.statusCode).toEqual(200)
			const nodes = await db.mindmapNode.findMany()
			expect(nodes).toHaveLength(1)
			expect(nodes[0]).toMatchObject({ worldId: world.id, name: 'Test node', positionX: 10, positionY: 20 })
		})

		it('creates node without explicit position supplied', async () => {
			const response = await api.send({
				name: 'Test node',
			})

			expect(response.statusCode).toEqual(200)
			const nodes = await db.mindmapNode.findMany()
			expect(nodes).toHaveLength(1)
			expect(nodes[0]).toMatchObject({ worldId: world.id, name: 'Test node', positionX: 0, positionY: 0 })
		})

		it('creates a node with numeric name', async () => {
			const response = await api.send({
				name: '123',
			})

			expect(response.statusCode).toEqual(200)
			const nodes = await db.mindmapNode.findMany()
			expect(nodes).toHaveLength(1)
			expect(nodes[0]).toMatchObject({ name: '123' })
		})

		it('rejects a node with excessively long name', async () => {
			const name = 'qwerty1234'.repeat(500)
			const response = await api.send({
				name,
			})

			expect(response.statusCode).toEqual(400)
			const nodes = await db.mindmapNode.findMany()
			expect(nodes).toHaveLength(0)
		})
	})

	describe('PATCH /api/world/:worldId/mindmap/nodes/:nodeId', () => {
		const node = mockMindmapNode()
		const api = withUserAuth(user).patch(`/api/world/${world.id}/mindmap/nodes/${node.id}`)

		beforeEach(async () => {
			await db.mindmapNode.create({ data: node })
		})

		it('updates the name for the world owner', async () => {
			const response = await api.send({ name: 'Updated name' })

			expect(response.statusCode).toEqual(200)
			const updated = await db.mindmapNode.findFirstOrThrow({ where: { id: node.id } })
			expect(updated).toMatchObject({ name: 'Updated name' })
		})

		it('accepts a numeric name', async () => {
			const response = await api.send({ name: 123 })

			expect(response.statusCode).toEqual(200)
			const updated = await db.mindmapNode.findFirstOrThrow({ where: { id: node.id } })
			expect(updated).toMatchObject({ name: '123' })
		})

		it('accepts a boolean name', async () => {
			const response = await api.send({ name: true })

			expect(response.statusCode).toEqual(200)
			const updated = await db.mindmapNode.findFirstOrThrow({ where: { id: node.id } })
			expect(updated).toMatchObject({ name: 'true' })
		})

		it('rejects an excessively long name', async () => {
			const name = 'qwerty1234'.repeat(500)
			const response = await api.send({ name })

			expect(response.statusCode).toEqual(400)
			const updated = await db.mindmapNode.findFirstOrThrow({ where: { id: node.id } })
			expect(updated).toMatchObject({ name: node.name })
		})
	})

	describe('PATCH /api/world/:worldId/mindmap/wires/:wireId', () => {
		const source = mockMindmapNode()
		const target = mockMindmapNode()
		const wire = mockMindmapLink({ sourceNodeId: source.id, targetNodeId: target.id })
		const api = withUserAuth(user).patch(`/api/world/${world.id}/mindmap/wires/${wire.id}`)

		beforeEach(async () => {
			await db.mindmapNode.createMany({ data: [source, target] })
			await db.mindmapLink.create({ data: wire })
		})

		it('updates the content for the world owner', async () => {
			const response = await api.send({ content: 'Updated content' })

			expect(response.statusCode).toEqual(200)
			const updated = await db.mindmapLink.findFirstOrThrow({ where: { id: wire.id } })
			expect(updated).toMatchObject({ content: 'Updated content' })
		})

		it('updates the direction', async () => {
			const response = await api.send({ direction: MindmapLinkDirection.TwoWay })

			expect(response.statusCode).toEqual(200)
			const updated = await db.mindmapLink.findFirstOrThrow({ where: { id: wire.id } })
			expect(updated).toMatchObject({ direction: MindmapLinkDirection.TwoWay })
		})

		it('accepts numeric content', async () => {
			const response = await api.send({ content: 123 })

			expect(response.statusCode).toEqual(200)
			const updated = await db.mindmapLink.findFirstOrThrow({ where: { id: wire.id } })
			expect(updated).toMatchObject({ content: '123' })
		})

		it('accepts boolean content', async () => {
			const response = await api.send({ content: true })

			expect(response.statusCode).toEqual(200)
			const updated = await db.mindmapLink.findFirstOrThrow({ where: { id: wire.id } })
			expect(updated).toMatchObject({ content: 'true' })
		})

		it('rejects excessively long content', async () => {
			const content = 'qwerty1234'.repeat(500)
			const response = await api.send({ content })

			expect(response.statusCode).toEqual(400)
			const updated = await db.mindmapLink.findFirstOrThrow({ where: { id: wire.id } })
			expect(updated).toMatchObject({ content: '' })
		})
	})
})
