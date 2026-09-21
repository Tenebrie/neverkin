import { CollaboratingUser, MindmapLink, MindmapNode, User, World } from '@prisma/client'
import { BaselineActor, BaselineArticle, BaselineTag, BaselineWorldEvent } from '@src/services/types.js'
import { randomUUID } from 'crypto'

export const mockUser = (data?: Partial<User>): User => ({
	id: randomUUID(),
	email: 'admin@localhost',
	level: 'Free',
	username: 'admin',
	password: 'qwerty1234',
	createdAt: new Date(0),
	updatedAt: new Date(0),
	bio: 'bio',
	avatarId: null,
	deletedAt: null,
	deletionScheduledAt: null,
	...data,
})

export const mockWorld = (data?: Partial<World>): World => ({
	id: 'world-1111',
	name: 'Test World',
	description: 'Test World Description',
	ownerId: 'undefined-user-1111',
	calendar: null,
	timeOrigin: BigInt(100),
	accessMode: 'Private',
	createdAt: new Date(0),
	updatedAt: new Date(0),
	...data,
})

export const mockCollaboratingUser = (data?: Partial<CollaboratingUser>): CollaboratingUser => ({
	userId: 'unknown-user-1111',
	worldId: 'unknown-world-1111',
	access: 'Editing',
	...data,
})

export const mockActor = (data?: Partial<BaselineActor>): BaselineActor => ({
	id: randomUUID(),
	createdAt: new Date(0),
	updatedAt: new Date(0),
	worldId: 'world-1111',
	name: 'Test Actor',
	title: 'Test Actor Title',
	icon: 'mui:person',
	color: '#000',
	pages: [],
	mentions: [],
	nodes: [],
	content: 'Test Actor Description',
	contentRich: '<p>Test Actor Description</p>',
	mentionedIn: [],
	parentFolderId: null,
	parentFolderPosition: 0,
	...data,
})

export const mockWikiArticle = (data?: Partial<BaselineArticle>): BaselineArticle => ({
	id: randomUUID(),
	createdAt: new Date(0),
	updatedAt: new Date(0),
	worldId: 'world-1111',
	name: 'Test Article',
	icon: 'mui:leaf',
	color: '#000',
	content: 'Test Article Content',
	contentRich: 'Test Article Content',
	mentions: [],
	mentionedIn: [],
	pages: [],
	parentFolderId: null,
	parentFolderPosition: 0,
	...data,
})

export const mockWorldEvent = (data?: Partial<BaselineWorldEvent>): BaselineWorldEvent => ({
	id: randomUUID(),
	createdAt: new Date(0),
	updatedAt: new Date(0),
	worldId: 'world-1111',
	name: 'Test Event',
	icon: 'mui:event',
	color: '#000',
	timestamp: BigInt(0),
	revokedAt: null,
	worldEventTrackId: null,
	content: 'Test Event Description',
	contentRich: '<p>Test Event Description</p>',
	pages: [],
	mentions: [],
	mentionedIn: [],
	deltaStates: [],
	parentFolderId: null,
	parentFolderPosition: 0,
	...data,
})

export const mockTag = (data?: Partial<BaselineTag>): BaselineTag => ({
	id: randomUUID(),
	createdAt: new Date(0),
	updatedAt: new Date(0),
	worldId: 'world-1111',
	name: 'Test Tag',
	description: 'Tag description',
	color: '#000',
	mentions: [],
	mentionedIn: [],
	parentFolderId: null,
	parentFolderPosition: 0,
	...data,
})

export const mockMindmapNode = (data?: Partial<MindmapNode>): MindmapNode => ({
	id: randomUUID(),
	createdAt: new Date(0),
	updatedAt: new Date(0),
	content: '',
	contentRich: '',
	parentFolderId: null,
	parentActorId: null,
	parentArticleId: null,
	parentEventId: null,
	parentTagId: null,
	worldId: 'world-1111',
	name: 'Test Node',
	positionX: 0,
	positionY: 0,
	...data,
})

export const mockMindmapLink = (data?: Partial<MindmapLink>): MindmapLink => ({
	id: randomUUID(),
	createdAt: new Date(0),
	updatedAt: new Date(0),
	sourceNodeId: 'unknown-node-1111',
	targetNodeId: 'unknown-node-2222',
	direction: 'Normal',
	content: '',
	...data,
})

export const mockToResponse = <T extends World | User>(data: T) => {
	return {
		...data,
		timeOrigin: 'timeOrigin' in data ? data.timeOrigin.toString() : undefined,
		createdAt: 'createdAt' in data ? data.createdAt.toISOString() : undefined,
		updatedAt: 'updatedAt' in data ? data.updatedAt.toISOString() : undefined,
	}
}
