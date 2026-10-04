import { MindmapPasteData } from '@neverkin/zod-schema'
import { MindmapLinkDirection } from '@prisma/client'
import { mockMindmapLink, mockMindmapNode, mockUser, mockWorld, withUserAuth } from '@src/mock/index.js'
import { setupMockDatabase } from '@src/mock/utils/setupMockDatabase.js'
import { RedisService } from '@src/services/RedisService.js'
import { randomUUID } from 'crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

	describe('POST /api/world/:worldId/mindmap/nodes/paste', () => {
		const api = withUserAuth(user).post(`/api/world/${world.id}/mindmap/nodes/paste`)

		const otherUser = mockUser({ email: 'other@localhost', username: 'other' })
		const otherWorld = mockWorld({ id: randomUUID(), ownerId: otherUser.id })

		beforeEach(async () => {
			await db.user.create({ data: otherUser })
			await db.world.create({ data: otherWorld })
			vi.spyOn(RedisService, 'notifyAboutMindmapNodesUpdate')
			vi.spyOn(RedisService, 'notifyAboutMindmapWiresCreate')
		})

		it('creates plain nodes relative to the paste origin', async () => {
			const response = await api.send({
				originX: 100,
				originY: 200,
				pasteData: {
					nodes: [
						plainNode({ tempId: 'a', offsetX: -10, offsetY: 5, plainNodeName: 'First' }),
						plainNode({ tempId: 'b', offsetX: 30, offsetY: -40, plainNodeName: 'Second' }),
					],
					internalLinks: [],
					externalLinks: [],
				},
			})

			expect(response.statusCode).toEqual(200)
			const nodes = await db.mindmapNode.findMany({ orderBy: { positionX: 'asc' } })
			expect(nodes).toEqual([
				expect.objectContaining({ worldId: world.id, name: 'First', positionX: 90, positionY: 205 }),
				expect.objectContaining({ worldId: world.id, name: 'Second', positionX: 130, positionY: 160 }),
			])
			expect(nodes.map((node) => node.id)).not.toContain('a')
			expect(nodes.map((node) => node.id)).not.toContain('b')
		})

		it('creates entity nodes with the matching parent column', async () => {
			const actor = { id: randomUUID(), worldId: world.id, name: 'Actor' }
			const article = { id: randomUUID(), worldId: world.id, name: 'Article' }
			const event = { id: randomUUID(), worldId: world.id, name: 'Event', timestamp: BigInt(0) }
			const folder = { id: randomUUID(), worldId: world.id, name: 'Folder' }
			const tag = { id: randomUUID(), worldId: world.id, name: 'Tag' }
			await db.actor.create({ data: actor })
			await db.wikiArticle.create({ data: article })
			await db.worldEvent.create({ data: event })
			await db.wikiFolder.create({ data: folder })
			await db.tag.create({ data: tag })

			const response = await api.send({
				originX: 0,
				originY: 0,
				pasteData: {
					nodes: [
						entityNode({ tempId: 'actor', parentType: 'actor', parentId: actor.id, offsetX: 1 }),
						entityNode({ tempId: 'article', parentType: 'article', parentId: article.id, offsetX: 2 }),
						entityNode({ tempId: 'event', parentType: 'event', parentId: event.id, offsetX: 3 }),
						entityNode({ tempId: 'folder', parentType: 'folder', parentId: folder.id, offsetX: 4 }),
						entityNode({ tempId: 'tag', parentType: 'tag', parentId: tag.id, offsetX: 5 }),
					],
					internalLinks: [],
					externalLinks: [],
				},
			})

			expect(response.statusCode).toEqual(200)
			const nodes = await db.mindmapNode.findMany({ orderBy: { positionX: 'asc' } })
			const noParents = {
				parentActorId: null,
				parentArticleId: null,
				parentEventId: null,
				parentFolderId: null,
				parentTagId: null,
			}
			expect(nodes).toEqual([
				expect.objectContaining({ ...noParents, parentActorId: actor.id, name: '' }),
				expect.objectContaining({ ...noParents, parentArticleId: article.id, name: '' }),
				expect.objectContaining({ ...noParents, parentEventId: event.id, name: '' }),
				expect.objectContaining({ ...noParents, parentFolderId: folder.id, name: '' }),
				expect.objectContaining({ ...noParents, parentTagId: tag.id, name: '' }),
			])
		})

		it('drops nodes whose parent belongs to another world', async () => {
			const foreignActor = { id: randomUUID(), worldId: otherWorld.id, name: 'Foreign actor' }
			await db.actor.create({ data: foreignActor })

			const response = await api.send({
				originX: 0,
				originY: 0,
				pasteData: {
					nodes: [
						plainNode({ tempId: 'plain' }),
						entityNode({ tempId: 'foreign', parentType: 'actor', parentId: foreignActor.id }),
					],
					internalLinks: [
						{ sourceTempId: 'plain', targetTempId: 'foreign', direction: 'Normal', content: '' },
					],
					externalLinks: [],
				},
			})

			expect(response.statusCode).toEqual(200)
			const nodes = await db.mindmapNode.findMany()
			expect(nodes).toHaveLength(1)
			expect(nodes[0]).toMatchObject({ parentActorId: null })
			expect(await db.mindmapLink.findMany()).toHaveLength(0)
		})

		it('drops nodes whose parent type does not match the parent id', async () => {
			const article = { id: randomUUID(), worldId: world.id, name: 'Article' }
			await db.wikiArticle.create({ data: article })

			const response = await api.send({
				originX: 0,
				originY: 0,
				pasteData: {
					nodes: [entityNode({ tempId: 'a', parentType: 'actor', parentId: article.id })],
					internalLinks: [],
					externalLinks: [],
				},
			})

			expect(response.statusCode).toEqual(200)
			expect(response.body).toEqual({ nodes: [], wires: [] })
			expect(await db.mindmapNode.findMany()).toHaveLength(0)
		})

		it('creates internal links between the new nodes', async () => {
			const response = await api.send({
				originX: 0,
				originY: 0,
				pasteData: {
					nodes: [
						plainNode({ tempId: 'a', plainNodeName: 'A' }),
						plainNode({ tempId: 'b', plainNodeName: 'B' }),
						plainNode({ tempId: 'c', plainNodeName: 'C' }),
					],
					internalLinks: [
						{ sourceTempId: 'a', targetTempId: 'b', direction: 'Reversed', content: 'knows' },
						{ sourceTempId: 'b', targetTempId: 'c', direction: 'TwoWay', content: '' },
						{ sourceTempId: 'a', targetTempId: 'missing', direction: 'Normal', content: '' },
					],
					externalLinks: [],
				},
			})

			expect(response.statusCode).toEqual(200)
			const nodes = await db.mindmapNode.findMany()
			const expectedIdOf = (name: string) => nodes.find((node) => node.name === name)!.id
			const links = await db.mindmapLink.findMany()
			expect(links).toHaveLength(2)
			expect(links).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						sourceNodeId: expectedIdOf('A'),
						targetNodeId: expectedIdOf('B'),
						direction: 'Reversed',
						content: 'knows',
					}),
					expect.objectContaining({
						sourceNodeId: expectedIdOf('B'),
						targetNodeId: expectedIdOf('C'),
						direction: 'TwoWay',
						content: '',
					}),
				]),
			)
		})

		it('creates external links only to existing nodes in the same world', async () => {
			const localNode = mockMindmapNode({ worldId: world.id })
			const foreignNode = mockMindmapNode({ worldId: otherWorld.id })
			await db.mindmapNode.createMany({ data: [localNode, foreignNode] })

			const response = await api.send({
				originX: 0,
				originY: 0,
				pasteData: {
					nodes: [plainNode({ tempId: 'a', plainNodeName: 'Pasted' })],
					internalLinks: [],
					externalLinks: [
						{ sourceTempId: 'a', targetNodeId: localNode.id, direction: 'Reversed', content: 'owns' },
						{ sourceTempId: 'a', targetNodeId: foreignNode.id, direction: 'Normal', content: '' },
						{ sourceTempId: 'a', targetNodeId: randomUUID(), direction: 'Normal', content: '' },
						{ sourceTempId: 'missing', targetNodeId: localNode.id, direction: 'Normal', content: '' },
					],
				},
			})

			expect(response.statusCode).toEqual(200)
			const pasted = await db.mindmapNode.findFirstOrThrow({ where: { name: 'Pasted' } })
			const links = await db.mindmapLink.findMany()
			expect(links).toEqual([
				expect.objectContaining({
					sourceNodeId: pasted.id,
					targetNodeId: localNode.id,
					direction: 'Reversed',
					content: 'owns',
				}),
			])
		})

		it('returns and broadcasts the created nodes and wires', async () => {
			const localNode = mockMindmapNode({ worldId: world.id })
			await db.mindmapNode.create({ data: localNode })

			const response = await api.send({
				originX: 0,
				originY: 0,
				pasteData: {
					nodes: [plainNode({ tempId: 'a' }), plainNode({ tempId: 'b' })],
					internalLinks: [{ sourceTempId: 'a', targetTempId: 'b', direction: 'Normal', content: '' }],
					externalLinks: [
						{ sourceTempId: 'a', targetNodeId: localNode.id, direction: 'Normal', content: '' },
					],
				},
			})

			expect(response.statusCode).toEqual(200)
			expect(response.body.nodes).toHaveLength(2)
			expect(response.body.wires).toHaveLength(2)
			expect(RedisService.notifyAboutMindmapNodesUpdate).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ worldId: world.id, nodes: expect.arrayContaining([expect.anything()]) }),
			)
			expect(RedisService.notifyAboutMindmapWiresCreate).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ worldId: world.id, created: expect.arrayContaining([expect.anything()]) }),
			)
		})

		it('rejects a user without write access', async () => {
			const response = await withUserAuth(user)
				.post(`/api/world/${otherWorld.id}/mindmap/nodes/paste`)
				.send({
					originX: 0,
					originY: 0,
					pasteData: { nodes: [plainNode({ tempId: 'a' })], internalLinks: [], externalLinks: [] },
				})

			expect(response.statusCode).toEqual(401)
			expect(await db.mindmapNode.findMany()).toHaveLength(0)
		})

		it('rejects malformed paste data', async () => {
			const response = await api.send({
				originX: 0,
				originY: 0,
				pasteData: { nodes: [{ tempId: 'a' }], internalLinks: [], externalLinks: [] },
			})

			expect(response.statusCode).toEqual(400)
			expect(await db.mindmapNode.findMany()).toHaveLength(0)
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

type PastedNode = MindmapPasteData['nodes'][number]

function plainNode(data: Pick<PastedNode, 'tempId'> & Partial<PastedNode>): PastedNode {
	return { offsetX: 0, offsetY: 0, parentId: null, parentType: 'node', plainNodeName: '', ...data }
}

function entityNode(
	data: Pick<PastedNode, 'tempId' | 'parentType' | 'parentId'> & Partial<PastedNode>,
): PastedNode {
	return { offsetX: 0, offsetY: 0, plainNodeName: 'Ignored name', ...data }
}
