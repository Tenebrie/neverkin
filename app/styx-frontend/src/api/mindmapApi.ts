import { baseApi as api } from './base/baseApi'
export const addTagTypes = ['mindmap', 'mindmapNode', 'mindmapWire'] as const
const injectedRtkApi = api
	.enhanceEndpoints({
		addTagTypes,
	})
	.injectEndpoints({
		endpoints: (build) => ({
			getMindmap: build.query<GetMindmapApiResponse, GetMindmapApiArg>({
				query: (queryArg) => ({ url: `/api/world/${queryArg.worldId}/mindmap` }),
				providesTags: ['mindmap', 'mindmapNode', 'mindmapWire'],
			}),
			createNode: build.mutation<CreateNodeApiResponse, CreateNodeApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/mindmap/nodes`,
					method: 'POST',
					body: queryArg.body,
				}),
				invalidatesTags: [],
			}),
			deleteNodes: build.mutation<DeleteNodesApiResponse, DeleteNodesApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/mindmap/nodes`,
					method: 'DELETE',
					params: {
						nodes: queryArg.nodes,
					},
				}),
				invalidatesTags: ['mindmap', 'mindmapNode'],
			}),
			updateNode: build.mutation<UpdateNodeApiResponse, UpdateNodeApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/mindmap/nodes/${queryArg.nodeId}`,
					method: 'PATCH',
					body: queryArg.body,
				}),
				invalidatesTags: [],
			}),
			moveMindmapNodes: build.mutation<MoveMindmapNodesApiResponse, MoveMindmapNodesApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/mindmap/nodes/move`,
					method: 'POST',
					body: queryArg.body,
				}),
				invalidatesTags: [],
			}),
			createMindmapWires: build.mutation<CreateMindmapWiresApiResponse, CreateMindmapWiresApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/mindmap/wires`,
					method: 'POST',
					body: queryArg.body,
				}),
				invalidatesTags: [],
			}),
			deleteMindmapWires: build.mutation<DeleteMindmapWiresApiResponse, DeleteMindmapWiresApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/mindmap/wires`,
					method: 'DELETE',
					params: {
						wires: queryArg.wires,
					},
				}),
				invalidatesTags: [],
			}),
			updateMindmapWire: build.mutation<UpdateMindmapWireApiResponse, UpdateMindmapWireApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/mindmap/wires/${queryArg.wireId}`,
					method: 'PATCH',
					body: queryArg.body,
				}),
				invalidatesTags: [],
			}),
		}),
		overrideExisting: false,
	})
export { injectedRtkApi as mindmapApi }
export type GetMindmapApiResponse = /** status 200  */ {
	nodes: {
		worldId: string
		id: string
		createdAt: string
		updatedAt: string
		name: string
		content: string
		contentRich: string
		parentFolderId?: null | string
		parentActorId?: null | string
		parentEventId?: null | string
		parentArticleId?: null | string
		positionX: number
		positionY: number
		parentTagId?: null | string
	}[]
	wires: {
		id: string
		createdAt: string
		updatedAt: string
		content: string
		sourceNodeId: string
		targetNodeId: string
		direction: 'Normal' | 'Reversed' | 'TwoWay'
	}[]
}
export type GetMindmapApiArg = {
	worldId: string
}
export type CreateNodeApiResponse = /** status 200  */ {
	worldId: string
	id: string
	createdAt: string
	updatedAt: string
	name: string
	content: string
	contentRich: string
	parentFolderId?: null | string
	parentActorId?: null | string
	parentEventId?: null | string
	parentArticleId?: null | string
	positionX: number
	positionY: number
	parentTagId?: null | string
}
export type CreateNodeApiArg = {
	worldId: string
	body: {
		id?: string
		positionX: number
		positionY: number
		name?: string
		parentActorId?: string
		parentArticleId?: string
		parentEventId?: string
		parentFolderId?: string
		parentTagId?: string
	}
}
export type DeleteNodesApiResponse = /** status 200  */ {
	count: number
}
export type DeleteNodesApiArg = {
	worldId: string
	nodes: string[]
}
export type UpdateNodeApiResponse = /** status 200  */ {
	worldId: string
	id: string
	createdAt: string
	updatedAt: string
	name: string
	content: string
	contentRich: string
	parentFolderId?: null | string
	parentActorId?: null | string
	parentEventId?: null | string
	parentArticleId?: null | string
	positionX: number
	positionY: number
	parentTagId?: null | string
}
export type UpdateNodeApiArg = {
	worldId: string
	nodeId: string
	body: {
		positionX?: number
		positionY?: number
		name?: string
		content?: string
		contentRich?: string
	}
}
export type MoveMindmapNodesApiResponse = /** status 200  */ {
	worldId: string
	id: string
	createdAt: string
	updatedAt: string
	name: string
	content: string
	contentRich: string
	parentFolderId?: null | string
	parentActorId?: null | string
	parentEventId?: null | string
	parentArticleId?: null | string
	positionX: number
	positionY: number
	parentTagId?: null | string
}[]
export type MoveMindmapNodesApiArg = {
	worldId: string
	body: {
		nodeIds: string[]
		deltaX: number
		deltaY: number
	}
}
export type CreateMindmapWiresApiResponse = /** status 200  */ {
	created: {
		id: string
		createdAt: string
		updatedAt: string
		content: string
		sourceNodeId: string
		targetNodeId: string
		direction: 'Normal' | 'Reversed' | 'TwoWay'
	}[]
	updated: {
		id: string
		createdAt: string
		updatedAt: string
		content: string
		sourceNodeId: string
		targetNodeId: string
		direction: 'Normal' | 'Reversed' | 'TwoWay'
	}[]
}
export type CreateMindmapWiresApiArg = {
	worldId: string
	body: {
		wires: {
			sourceNodeId: string
			targetNodeId: string
		}[]
	}
}
export type DeleteMindmapWiresApiResponse = /** status 200  */ string[]
export type DeleteMindmapWiresApiArg = {
	worldId: string
	wires: string[]
}
export type UpdateMindmapWireApiResponse = /** status 200  */ {
	id: string
	createdAt: string
	updatedAt: string
	content: string
	sourceNodeId: string
	targetNodeId: string
	direction: 'Normal' | 'Reversed' | 'TwoWay'
}
export type UpdateMindmapWireApiArg = {
	worldId: string
	wireId: string
	body: {
		direction?: 'Normal' | 'Reversed' | 'TwoWay'
		content?: string
	}
}
export const {
	useGetMindmapQuery,
	useLazyGetMindmapQuery,
	useCreateNodeMutation,
	useDeleteNodesMutation,
	useUpdateNodeMutation,
	useMoveMindmapNodesMutation,
	useCreateMindmapWiresMutation,
	useDeleteMindmapWiresMutation,
	useUpdateMindmapWireMutation,
} = injectedRtkApi
