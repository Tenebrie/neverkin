import { baseApi as api } from './base/baseApi'
export const addTagTypes = ['dataMigration', 'asset'] as const
const injectedRtkApi = api
	.enhanceEndpoints({
		addTagTypes,
	})
	.injectEndpoints({
		endpoints: (build) => ({
			validateImportUserData: build.mutation<ValidateImportUserDataApiResponse, ValidateImportUserDataApiArg>(
				{
					query: (queryArg) => ({
						url: `/api/import/user-data/validate`,
						method: 'POST',
						body: queryArg.body,
					}),
					invalidatesTags: ['dataMigration', 'asset'],
				},
			),
			importUserData: build.mutation<ImportUserDataApiResponse, ImportUserDataApiArg>({
				query: (queryArg) => ({ url: `/api/import/user-data/commit`, method: 'POST', body: queryArg.body }),
				invalidatesTags: ['dataMigration', 'asset'],
			}),
			exportUserData: build.mutation<ExportUserDataApiResponse, ExportUserDataApiArg>({
				query: () => ({ url: `/api/export/user-data`, method: 'POST' }),
				invalidatesTags: ['dataMigration', 'asset'],
			}),
			exportUserDataInline: build.mutation<ExportUserDataInlineApiResponse, ExportUserDataInlineApiArg>({
				query: () => ({ url: `/api/export/user-data/inline`, method: 'POST' }),
				invalidatesTags: ['dataMigration'],
			}),
		}),
		overrideExisting: false,
	})
export { injectedRtkApi as dataMigrationApi }
export type ValidateImportUserDataApiResponse = unknown
export type ValidateImportUserDataApiArg = {
	body: {
		assetId: string
	}
}
export type ImportUserDataApiResponse = unknown
export type ImportUserDataApiArg = {
	body: {
		assetId: string
	}
}
export type ExportUserDataApiResponse = /** status 200  */ {
	url: string
}
export type ExportUserDataApiArg = void
export type ExportUserDataInlineApiResponse = /** status 200  */ {
	version: number
	user: {
		id: string
		calendars: {
			units: {
				children: {
					id: string
					createdAt: string
					updatedAt: string
					position: number
					calendarId: string
					label?: null | string
					shortLabel?: null | string
					repeats: number
					parentUnitId: string
					childUnitId: string
				}[]
				id: string
				createdAt: string
				updatedAt: string
				name: string
				position: number
				calendarId: string
				formatMode: 'Name' | 'NameOneIndexed' | 'Numeric' | 'NumericOneIndexed' | 'Hidden'
				negativeFormat: 'MinusSign' | 'AbsoluteValue'
				displayName?: null | string
				displayNameShort?: null | string
				displayNamePlural?: null | string
				formatShorthand?: null | string
				duration: string
				treeDepth: number
			}[]
			seasons: {
				intervals: {
					id: string
					createdAt: string
					updatedAt: string
					calendarId: string
					leftIndex: number
					rightIndex: number
					seasonId: string
				}[]
				id: string
				createdAt: string
				updatedAt: string
				name: string
				position: number
				calendarId: string
				formatShorthand?: null | string
			}[]
			presentations: {
				units: {
					id: string
					createdAt: string
					updatedAt: string
					name: string
					position: number
					calendarId: string
					formatString: string
					subdivision: number
					labeledIndices: number[]
					unitId: string
					presentationId: string
				}[]
				id: string
				createdAt: string
				updatedAt: string
				name: string
				calendarId: string
				compression: number
				scaleFactor: number
				baselineUnitId?: null | string
			}[]
			id: string
			createdAt: string
			updatedAt: string
			name: string
			ownerId?: null | string
			position: number
			worldId?: null | string
			description: string
			originTime: string
			dateFormat?: null | string
		}[]
		worlds: {
			calendars: {
				units: {
					children: {
						id: string
						createdAt: string
						updatedAt: string
						position: number
						calendarId: string
						label?: null | string
						shortLabel?: null | string
						repeats: number
						parentUnitId: string
						childUnitId: string
					}[]
					id: string
					createdAt: string
					updatedAt: string
					name: string
					position: number
					calendarId: string
					formatMode: 'Name' | 'NameOneIndexed' | 'Numeric' | 'NumericOneIndexed' | 'Hidden'
					negativeFormat: 'MinusSign' | 'AbsoluteValue'
					displayName?: null | string
					displayNameShort?: null | string
					displayNamePlural?: null | string
					formatShorthand?: null | string
					duration: string
					treeDepth: number
				}[]
				seasons: {
					intervals: {
						id: string
						createdAt: string
						updatedAt: string
						calendarId: string
						leftIndex: number
						rightIndex: number
						seasonId: string
					}[]
					id: string
					createdAt: string
					updatedAt: string
					name: string
					position: number
					calendarId: string
					formatShorthand?: null | string
				}[]
				presentations: {
					units: {
						id: string
						createdAt: string
						updatedAt: string
						name: string
						position: number
						calendarId: string
						formatString: string
						subdivision: number
						labeledIndices: number[]
						unitId: string
						presentationId: string
					}[]
					id: string
					createdAt: string
					updatedAt: string
					name: string
					calendarId: string
					compression: number
					scaleFactor: number
					baselineUnitId?: null | string
				}[]
				id: string
				createdAt: string
				updatedAt: string
				name: string
				ownerId?: null | string
				position: number
				worldId?: null | string
				description: string
				originTime: string
				dateFormat?: null | string
			}[]
			tags: {
				mentions: {
					id: string
					sourceType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
					targetType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
					pageId?: null | string
					sourceId: string
					targetId: string
					sourceActorId?: null | string
					sourceEventId?: null | string
					sourceArticleId?: null | string
					sourceTagId?: null | string
					sourceNodeId?: null | string
					targetActorId?: null | string
					targetEventId?: null | string
					targetArticleId?: null | string
					targetTagId?: null | string
				}[]
				id: string
				createdAt: string
				updatedAt: string
				name: string
				worldId: string
				description: string
				color: string
				parentFolderId?: null | string
				parentFolderPosition: number
			}[]
			events: {
				pages: {
					id: string
					createdAt: string
					updatedAt: string
					name: string
					parentType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
					content: string
					contentRich: string
					parentActorId?: null | string
					parentEventId?: null | string
					parentArticleId?: null | string
					parentNodeId?: null | string
				}[]
				mentions: {
					id: string
					sourceType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
					targetType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
					pageId?: null | string
					sourceId: string
					targetId: string
					sourceActorId?: null | string
					sourceEventId?: null | string
					sourceArticleId?: null | string
					sourceTagId?: null | string
					sourceNodeId?: null | string
					targetActorId?: null | string
					targetEventId?: null | string
					targetArticleId?: null | string
					targetTagId?: null | string
				}[]
				id: string
				createdAt: string
				updatedAt: string
				name: string
				worldId: string
				content: string
				contentRich: string
				icon: string
				color: string
				parentFolderId?: null | string
				parentFolderPosition: number
				timestamp: string
				revokedAt?: null | string
				worldEventTrackId?: null | string
			}[]
			savedColors: {
				id: string
				createdAt: string
				updatedAt: string
				value: string
				label?: null | string
				worldId: string
			}[]
			worldCommonIconSets: {
				id: string
				worldId: string
				iconSet: string
			}[]
			worldEventTracks: {
				id: string
				createdAt: string
				updatedAt: string
				name: string
				position: number
				worldId: string
				visible: boolean
			}[]
			actors: {
				pages: {
					id: string
					createdAt: string
					updatedAt: string
					name: string
					parentType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
					content: string
					contentRich: string
					parentActorId?: null | string
					parentEventId?: null | string
					parentArticleId?: null | string
					parentNodeId?: null | string
				}[]
				mentions: {
					id: string
					sourceType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
					targetType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
					pageId?: null | string
					sourceId: string
					targetId: string
					sourceActorId?: null | string
					sourceEventId?: null | string
					sourceArticleId?: null | string
					sourceTagId?: null | string
					sourceNodeId?: null | string
					targetActorId?: null | string
					targetEventId?: null | string
					targetArticleId?: null | string
					targetTagId?: null | string
				}[]
				id: string
				createdAt: string
				updatedAt: string
				name: string
				worldId: string
				content: string
				contentRich: string
				icon: string
				color: string
				parentFolderId?: null | string
				parentFolderPosition: number
				title: string
			}[]
			articles: {
				pages: {
					id: string
					createdAt: string
					updatedAt: string
					name: string
					parentType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
					content: string
					contentRich: string
					parentActorId?: null | string
					parentEventId?: null | string
					parentArticleId?: null | string
					parentNodeId?: null | string
				}[]
				mentions: {
					id: string
					sourceType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
					targetType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
					pageId?: null | string
					sourceId: string
					targetId: string
					sourceActorId?: null | string
					sourceEventId?: null | string
					sourceArticleId?: null | string
					sourceTagId?: null | string
					sourceNodeId?: null | string
					targetActorId?: null | string
					targetEventId?: null | string
					targetArticleId?: null | string
					targetTagId?: null | string
				}[]
				id: string
				createdAt: string
				updatedAt: string
				name: string
				worldId: string
				content: string
				contentRich: string
				icon: string
				color: string
				parentFolderId?: null | string
				parentFolderPosition: number
			}[]
			mindmapNodes: {
				pages: {
					id: string
					createdAt: string
					updatedAt: string
					name: string
					parentType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
					content: string
					contentRich: string
					parentActorId?: null | string
					parentEventId?: null | string
					parentArticleId?: null | string
					parentNodeId?: null | string
				}[]
				mentions: {
					id: string
					sourceType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
					targetType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
					pageId?: null | string
					sourceId: string
					targetId: string
					sourceActorId?: null | string
					sourceEventId?: null | string
					sourceArticleId?: null | string
					sourceTagId?: null | string
					sourceNodeId?: null | string
					targetActorId?: null | string
					targetEventId?: null | string
					targetArticleId?: null | string
					targetTagId?: null | string
				}[]
				links: {
					id: string
					createdAt: string
					updatedAt: string
					content: string
					sourceNodeId: string
					direction: 'Normal' | 'Reversed' | 'TwoWay'
					targetNodeId: string
				}[]
				id: string
				createdAt: string
				updatedAt: string
				name: string
				worldId: string
				content: string
				contentRich: string
				parentActorId?: null | string
				parentEventId?: null | string
				parentArticleId?: null | string
				parentFolderId?: null | string
				positionX: number
				positionY: number
				parentTagId?: null | string
			}[]
			folders: {
				id: string
				createdAt: string
				updatedAt: string
				name: string
				worldId: string
				icon: string
				color: string
				parentFolderId?: null | string
				parentFolderPosition: number
			}[]
			id: string
			createdAt: string
			updatedAt: string
			name: string
			ownerId: string
			calendar?: null | 'COUNTUP' | 'EARTH' | 'PF2E' | 'RIMWORLD' | 'EXETHER'
			description: string
			accessMode: 'Private' | 'PublicRead' | 'PublicEdit'
			timeOrigin: string
		}[]
	}
}
export type ExportUserDataInlineApiArg = void
export const {
	useValidateImportUserDataMutation,
	useImportUserDataMutation,
	useExportUserDataMutation,
	useExportUserDataInlineMutation,
} = injectedRtkApi
