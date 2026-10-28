import type { SetupServer } from 'msw/node'

import { UpdateActorApiResponse } from '../actorListApi'
import { GetAnnouncementsApiResponse } from '../announcementListApi'
import { CheckAuthenticationApiResponse, CreateAccountApiResponse, PostLoginApiResponse } from '../authApi'
import { UpdateNodeApiResponse } from '../mindmapApi'
import { ListWorldAccessModesApiResponse } from '../otherApi'
import { GetWorldCollaboratorsApiResponse } from '../worldCollaboratorsApi'
import { GetWorldColorsApiResponse } from '../worldColorApi'
import { GetWorldBriefApiResponse, GetWorldInfoApiResponse } from '../worldDetailsApi'
import { DeleteWorldEventApiResponse, UpdateWorldEventApiResponse } from '../worldEventApi'
import { CreateWorldApiResponse, DeleteWorldApiResponse, GetWorldsApiResponse } from '../worldListApi'
import { generateEndpointMock, type MockParams } from './generateEndpointMock'

/**
 * API call mocks
 */
export const mockCheckAuthentication = (
	server: SetupServer,
	params: MockParams<CheckAuthenticationApiResponse>,
) => generateEndpointMock(server, { method: 'get', path: '/api/auth', ...params })

export const mockGetWorlds = (server: SetupServer, params: MockParams<GetWorldsApiResponse>) =>
	generateEndpointMock(server, { method: 'get', path: '/api/worlds', ...params })

export const mockGetWorldBrief = (
	server: SetupServer,
	params: { worldId: string } & MockParams<GetWorldBriefApiResponse>,
) => generateEndpointMock(server, { method: 'get', path: `/api/world/${params.worldId}/brief`, ...params })

export const mockGetWorldDetails = (
	server: SetupServer,
	params: { worldId: string } & MockParams<GetWorldInfoApiResponse>,
) => generateEndpointMock(server, { method: 'get', path: `/api/world/${params.worldId}`, ...params })

export const mockCreateWorld = (server: SetupServer, params: MockParams<CreateWorldApiResponse>) =>
	generateEndpointMock(server, { method: 'post', path: `/api/worlds`, ...params })

export const mockDeleteWorld = (
	server: SetupServer,
	params: { worldId: string } & MockParams<DeleteWorldApiResponse>,
) => generateEndpointMock(server, { method: 'delete', path: `/api/world/${params.worldId}`, ...params })

export const mockGetWorldCollaborators = (
	server: SetupServer,
	params: { worldId: string } & MockParams<GetWorldCollaboratorsApiResponse>,
) =>
	generateEndpointMock(server, {
		method: 'get',
		path: `/api/world/${params.worldId}/collaborators`,
		...params,
	})

export const mockPostRegister = (server: SetupServer, params: MockParams<CreateAccountApiResponse>) =>
	generateEndpointMock(server, { method: 'post', path: '/api/auth', ...params })

export const mockPostLogin = (server: SetupServer, params: MockParams<PostLoginApiResponse>) =>
	generateEndpointMock(server, { method: 'post', path: '/api/auth/login', ...params })

export const mockUpdateActor = (
	server: SetupServer,
	params: { worldId: string; actorId: string } & MockParams<UpdateActorApiResponse>,
) =>
	generateEndpointMock(server, {
		method: 'patch',
		path: `/api/world/${params.worldId}/actor/${params.actorId}`,
		...params,
	})

export const mockUpdateWorldEvent = (
	server: SetupServer,
	params: { worldId: string; eventId: string } & MockParams<UpdateWorldEventApiResponse>,
) =>
	generateEndpointMock(server, {
		method: 'patch',
		path: `/api/world/${params.worldId}/event/${params.eventId}`,
		...params,
	})

export const mockUpdateMindmapNode = (
	server: SetupServer,
	params: { worldId: string; nodeId: string } & MockParams<UpdateNodeApiResponse>,
) =>
	generateEndpointMock(server, {
		method: 'patch',
		path: `/api/world/${params.worldId}/mindmap/nodes/${params.nodeId}`,
		...params,
	})

export const mockGetWorldColors = (
	server: SetupServer,
	params: { worldId: string } & MockParams<GetWorldColorsApiResponse>,
) => generateEndpointMock(server, { method: 'get', path: `/api/worlds/${params.worldId}/colors`, ...params })

export const mockDeleteWorldEvent = (
	server: SetupServer,
	params: { worldId: string; eventId: string } & MockParams<DeleteWorldEventApiResponse>,
) =>
	generateEndpointMock(server, {
		method: 'delete',
		path: `/api/world/${params.worldId}/event/${params.eventId}`,
		...params,
	})

export const mockAddCollaborator = (server: SetupServer, params: { worldId: string } & MockParams<null>) =>
	generateEndpointMock(server, { method: 'post', path: `/api/world/${params.worldId}/share`, ...params })

export const mockRemoveCollaborator = (
	server: SetupServer,
	params: { worldId: string; userId: string } & MockParams<null>,
) =>
	generateEndpointMock(server, {
		method: 'delete',
		path: `/api/world/${params.worldId}/share/${params.userId}`,
		...params,
	})

export const mockGetAnnouncements = (server: SetupServer, params: MockParams<GetAnnouncementsApiResponse>) =>
	generateEndpointMock(server, {
		method: 'get',
		path: '/api/announcements',
		...params,
	})

export const mockListWorldAccessModes = (
	server: SetupServer,
	params: MockParams<ListWorldAccessModesApiResponse>,
) => generateEndpointMock(server, { method: 'get', path: '/api/constants/world-access-modes', ...params })

/**
 * Mock utility functions
 */
export const mockAuthenticatedUser = (server: SetupServer) =>
	mockCheckAuthentication(server, {
		response: {
			authenticated: true,
			sessionId: 'test-session-id',
			user: {
				id: '1111-2222-3333',
				email: 'admin@localhost',
				username: 'admin',
				level: 'Admin',
				bio: 'My detailed bio',
				featureFlags: [],
			},
		},
	})

export const mockNonAuthenticatedUser = (server: SetupServer) =>
	mockCheckAuthentication(server, {
		response: {
			authenticated: false,
			sessionId: 'test-session-id',
		},
	})
