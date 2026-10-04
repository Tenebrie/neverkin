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
			pasteMindmapNodes: build.mutation<PasteMindmapNodesApiResponse, PasteMindmapNodesApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/mindmap/nodes/paste`,
					method: 'POST',
					body: queryArg.body,
				}),
				invalidatesTags: ['mindmap', 'mindmapNode'],
			}),
			deleteNodes: build.mutation<DeleteNodesApiResponse, DeleteNodesApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/mindmap/nodes/delete`,
					method: 'POST',
					body: queryArg.body,
				}),
				invalidatesTags: ['mindmap', 'mindmapNode'],
			}),
			createMindmapWires: build.mutation<CreateMindmapWiresApiResponse, CreateMindmapWiresApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/mindmap/wires`,
					method: 'POST',
					body: queryArg.body,
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
			deleteMindmapWires: build.mutation<DeleteMindmapWiresApiResponse, DeleteMindmapWiresApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/mindmap/wires/delete`,
					method: 'POST',
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
		positionX?: number
		positionY?: number
		name?: string
		parentActorId?: string
		parentArticleId?: string
		parentEventId?: string
		parentFolderId?: string
		parentTagId?: string
	}
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
export type PasteMindmapNodesApiResponse = /** status 200  */ {
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
export type PasteMindmapNodesApiArg = {
	worldId: string
	body: {
		originX: number
		originY: number
		pasteData: {
			nodes: {
				tempId: string
				offsetX: number
				offsetY: number
				parentId?: null | string
				parentType: 'actor' | 'tag' | 'node' | 'article' | 'event' | 'folder'
				plainNodeName: string
			}[]
			internalLinks: {
				sourceTempId: string
				targetTempId: string
				direction: 'Normal' | 'Reversed' | 'TwoWay'
			}[]
			externalLinks: {
				sourceTempId: string
				targetNodeId: string
				direction: 'Normal' | 'Reversed' | 'TwoWay'
			}[]
		}
	}
}
export type DeleteNodesApiResponse = /** status 200  */ {
	count: number
}
export type DeleteNodesApiArg = {
	worldId: string
	body: {
		nodes: string[]
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
export type DeleteMindmapWiresApiResponse = /** status 200  */ string[]
export type DeleteMindmapWiresApiArg = {
	worldId: string
	body: {
		wires: string[]
	}
}
export const {
	useGetMindmapQuery,
	useLazyGetMindmapQuery,
	useCreateNodeMutation,
	useUpdateNodeMutation,
	useReparentNodeMutation,
	useMoveMindmapNodesMutation,
	usePasteMindmapNodesMutation,
	useDeleteNodesMutation,
	useCreateMindmapWiresMutation,
	useUpdateMindmapWireMutation,
	useSplitMindmapWireMutation,
	useDeleteMindmapWiresMutation,
} = injectedRtkApi
