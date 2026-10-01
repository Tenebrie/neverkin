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
			reparentNode: build.mutation<ReparentNodeApiResponse, ReparentNodeApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/mindmap/nodes/${queryArg.nodeId}/reparent`,
					method: 'POST',
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
			splitMindmapWire: build.mutation<SplitMindmapWireApiResponse, SplitMindmapWireApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/mindmap/wires/${queryArg.wireId}/split`,
					method: 'POST',
					body: queryArg.body,
				}),
				invalidatesTags: ['mindmap', 'mindmapNode', 'mindmapWire'],
			}),
		}),
		overrideExisting: false,
	})
export { injectedRtkApi as mindmapApi }
export type GetMindmapApiResponse = /** status 200  */ {
	nodes: {
		id: string
		createdAt: string
		updatedAt: string
		name: string
		worldId: string
		positionX: number
		positionY: number
		content: string
		contentRich: string
		parentActorId?: null | string
		parentArticleId?: null | string
		parentEventId?: null | string
		parentFolderId?: null | string
		parentTagId?: null | string
	}[]
	wires: {
		id: string
		createdAt: string
		updatedAt: string
		direction: 'Normal' | 'Reversed' | 'TwoWay'
		content: string
		sourceNodeId: string
		targetNodeId: string
	}[]
}
export type GetMindmapApiArg = {
	worldId: string
}
export type CreateNodeApiResponse = /** status 200  */ {
	id: string
	createdAt: string
	updatedAt: string
	name: string
	worldId: string
	positionX: number
	positionY: number
	content: string
	contentRich: string
	parentActorId?: null | string
	parentArticleId?: null | string
	parentEventId?: null | string
	parentFolderId?: null | string
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
	id: string
	createdAt: string
	updatedAt: string
	name: string
	worldId: string
	positionX: number
	positionY: number
	content: string
	contentRich: string
	parentActorId?: null | string
	parentArticleId?: null | string
	parentEventId?: null | string
	parentFolderId?: null | string
	parentTagId?: null | string
}
export type UpdateNodeApiArg = {
	worldId: string
	nodeId: string
	body: {
		positionX?: number
		positionY?: number
		name?: string
	}
}
export type ReparentNodeApiResponse = /** status 200  */ {
	id: string
	createdAt: string
	updatedAt: string
	name: string
	worldId: string
	positionX: number
	positionY: number
	content: string
	contentRich: string
	parentActorId?: null | string
	parentArticleId?: null | string
	parentEventId?: null | string
	parentFolderId?: null | string
	parentTagId?: null | string
}
export type ReparentNodeApiArg = {
	worldId: string
	nodeId: string
	body: {
		positionX?: number
		positionY?: number
		parentActorId?: string
		parentArticleId?: string
		parentEventId?: string
		parentFolderId?: string
		parentTagId?: string
	}
}
export type MoveMindmapNodesApiResponse = /** status 200  */ {
	id: string
	createdAt: string
	updatedAt: string
	name: string
	worldId: string
	positionX: number
	positionY: number
	content: string
	contentRich: string
	parentActorId?: null | string
	parentArticleId?: null | string
	parentEventId?: null | string
	parentFolderId?: null | string
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
		direction: 'Normal' | 'Reversed' | 'TwoWay'
		content: string
		sourceNodeId: string
		targetNodeId: string
	}[]
	updated: {
		id: string
		createdAt: string
		updatedAt: string
		direction: 'Normal' | 'Reversed' | 'TwoWay'
		content: string
		sourceNodeId: string
		targetNodeId: string
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
	direction: 'Normal' | 'Reversed' | 'TwoWay'
	content: string
	sourceNodeId: string
	targetNodeId: string
}
export type UpdateMindmapWireApiArg = {
	worldId: string
	wireId: string
	body: {
		direction?: 'Normal' | 'Reversed' | 'TwoWay'
		content?: string
	}
}
export type SplitMindmapWireApiResponse = /** status 200  */ {
	node: {
		id: string
		createdAt: string
		updatedAt: string
		name: string
		worldId: string
		positionX: number
		positionY: number
		content: string
		contentRich: string
		parentActorId?: null | string
		parentArticleId?: null | string
		parentEventId?: null | string
		parentFolderId?: null | string
		parentTagId?: null | string
	}
	wires: {
		id: string
		createdAt: string
		updatedAt: string
		direction: 'Normal' | 'Reversed' | 'TwoWay'
		content: string
		sourceNodeId: string
		targetNodeId: string
	}[]
}
export type SplitMindmapWireApiArg = {
	worldId: string
	wireId: string
	body: {
		positionX: number
		positionY: number
		name: string
		direction: 'Normal' | 'Reversed' | 'TwoWay'
	}
}
export const {
	useGetMindmapQuery,
	useLazyGetMindmapQuery,
	useCreateNodeMutation,
	useDeleteNodesMutation,
	useUpdateNodeMutation,
	useReparentNodeMutation,
	useMoveMindmapNodesMutation,
	useCreateMindmapWiresMutation,
	useDeleteMindmapWiresMutation,
	useUpdateMindmapWireMutation,
	useSplitMindmapWireMutation,
} = injectedRtkApi
