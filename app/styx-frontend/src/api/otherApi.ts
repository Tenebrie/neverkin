import { baseApi as api } from './base/baseApi'
export const addTagTypes = ['worldShareLink', 'worldWikiArticle'] as const
const injectedRtkApi = api
	.enhanceEndpoints({
		addTagTypes,
	})
	.injectEndpoints({
		endpoints: (build) => ({
			adminGetUserLevels: build.query<AdminGetUserLevelsApiResponse, AdminGetUserLevelsApiArg>({
				query: () => ({ url: `/api/constants/admin-levels` }),
				providesTags: [],
			}),
			listWorldAccessModes: build.query<ListWorldAccessModesApiResponse, ListWorldAccessModesApiArg>({
				query: () => ({ url: `/api/constants/world-access-modes` }),
				providesTags: [],
			}),
			listCalendarTemplates: build.query<ListCalendarTemplatesApiResponse, ListCalendarTemplatesApiArg>({
				query: () => ({ url: `/api/constants/calendar-templates` }),
				providesTags: [],
			}),
			listCalendarUnitFormatModes: build.query<
				ListCalendarUnitFormatModesApiResponse,
				ListCalendarUnitFormatModesApiArg
			>({
				query: () => ({ url: `/api/constants/calendar-unit-format-modes` }),
				providesTags: [],
			}),
			listImageGenerationModels: build.query<
				ListImageGenerationModelsApiResponse,
				ListImageGenerationModelsApiArg
			>({
				query: () => ({ url: `/api/constants/image-generation-models` }),
				providesTags: [],
			}),
			listFeatureFlags: build.query<ListFeatureFlagsApiResponse, ListFeatureFlagsApiArg>({
				query: () => ({ url: `/api/constants/feature-flags` }),
				providesTags: [],
			}),
			sendContactFormMessage: build.mutation<SendContactFormMessageApiResponse, SendContactFormMessageApiArg>(
				{
					query: (queryArg) => ({ url: `/api/contact`, method: 'POST', body: queryArg.body }),
					invalidatesTags: [],
				},
			),
			getEntityContent: build.query<GetEntityContentApiResponse, GetEntityContentApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/${queryArg.entityType}/${queryArg.entityId}/content`,
				}),
				providesTags: [],
			}),
			putEntityContent: build.mutation<PutEntityContentApiResponse, PutEntityContentApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/${queryArg.entityType}/${queryArg.entityId}/content`,
					method: 'PUT',
					body: queryArg.body,
				}),
				invalidatesTags: [],
			}),
			getEntityContentPage: build.query<GetEntityContentPageApiResponse, GetEntityContentPageApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/${queryArg.entityType}/${queryArg.entityId}/content/pages/${queryArg.pageId}`,
				}),
				providesTags: [],
			}),
			putEntityContentPage: build.mutation<PutEntityContentPageApiResponse, PutEntityContentPageApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/${queryArg.entityType}/${queryArg.entityId}/content/pages/${queryArg.pageId}`,
					method: 'PUT',
					body: queryArg.body,
				}),
				invalidatesTags: [],
			}),
			deleteEntityContentPage: build.mutation<
				DeleteEntityContentPageApiResponse,
				DeleteEntityContentPageApiArg
			>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/${queryArg.entityType}/${queryArg.entityId}/content/pages/${queryArg.pageId}`,
					method: 'DELETE',
				}),
				invalidatesTags: [],
			}),
			createEntityContentPage: build.mutation<
				CreateEntityContentPageApiResponse,
				CreateEntityContentPageApiArg
			>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/${queryArg.entityType}/${queryArg.entityId}/content/pages`,
					method: 'POST',
					body: queryArg.body,
				}),
				invalidatesTags: [],
			}),
			getHealth: build.query<GetHealthApiResponse, GetHealthApiArg>({
				query: () => ({ url: `/health` }),
				providesTags: [],
			}),
			getApiHealth: build.query<GetApiHealthApiResponse, GetApiHealthApiArg>({
				query: () => ({ url: `/api/health` }),
				providesTags: [],
			}),
			getSupportedImageFormats: build.query<
				GetSupportedImageFormatsApiResponse,
				GetSupportedImageFormatsApiArg
			>({
				query: () => ({ url: `/api/images/formats` }),
				providesTags: [],
			}),
			requestImageConversion: build.mutation<RequestImageConversionApiResponse, RequestImageConversionApiArg>(
				{
					query: (queryArg) => ({ url: `/api/images/convert`, method: 'POST', body: queryArg.body }),
					invalidatesTags: [],
				},
			),
			listWorldShareLinks: build.query<ListWorldShareLinksApiResponse, ListWorldShareLinksApiArg>({
				query: (queryArg) => ({ url: `/api/world/${queryArg.worldId}/share-links` }),
				providesTags: ['worldShareLink'],
			}),
			generateFreeWorldShareLink: build.mutation<
				GenerateFreeWorldShareLinkApiResponse,
				GenerateFreeWorldShareLinkApiArg
			>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/share-link/generate`,
					method: 'POST',
					body: queryArg.body,
				}),
				invalidatesTags: [],
			}),
			createWorldShareLink: build.mutation<CreateWorldShareLinkApiResponse, CreateWorldShareLinkApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/share-link`,
					method: 'POST',
					body: queryArg.body,
				}),
				invalidatesTags: ['worldShareLink'],
			}),
			expireWorldShareLink: build.mutation<ExpireWorldShareLinkApiResponse, ExpireWorldShareLinkApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/share-link/${queryArg.shareLinkId}/expire`,
					method: 'POST',
				}),
				invalidatesTags: ['worldShareLink'],
			}),
			deleteWorldShareLink: build.mutation<DeleteWorldShareLinkApiResponse, DeleteWorldShareLinkApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/share-link/${queryArg.shareLinkId}`,
					method: 'DELETE',
				}),
				invalidatesTags: ['worldShareLink'],
			}),
			visitWorldShareLink: build.query<VisitWorldShareLinkApiResponse, VisitWorldShareLinkApiArg>({
				query: (queryArg) => ({ url: `/api/share-link-visit/${queryArg.slug}` }),
				providesTags: [],
			}),
			acceptWorldShareLink: build.mutation<AcceptWorldShareLinkApiResponse, AcceptWorldShareLinkApiArg>({
				query: (queryArg) => ({ url: `/api/share-link-visit/${queryArg.slug}/accept`, method: 'POST' }),
				invalidatesTags: [],
			}),
			updateArticle: build.mutation<UpdateArticleApiResponse, UpdateArticleApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/wiki/article/${queryArg.articleId}`,
					method: 'PATCH',
					body: queryArg.body,
				}),
				invalidatesTags: ['worldWikiArticle'],
			}),
			getArticleBacklinks: build.query<GetArticleBacklinksApiResponse, GetArticleBacklinksApiArg>({
				query: (queryArg) => ({
					url: `/api/world/${queryArg.worldId}/wiki/article/${queryArg.articleId}/backlinks`,
				}),
				providesTags: ['worldWikiArticle'],
			}),
			getUserWorldAccessLevel: build.query<GetUserWorldAccessLevelApiResponse, GetUserWorldAccessLevelApiArg>(
				{
					query: (queryArg) => ({
						url: `/api/internal/auth/${queryArg.userId}`,
						params: {
							worldId: queryArg.worldId,
						},
					}),
					providesTags: [],
				},
			),
		}),
		overrideExisting: false,
	})
export { injectedRtkApi as otherApi }
export type AdminGetUserLevelsApiResponse = /** status 200  */ ('Free' | 'Premium' | 'Admin')[]
export type AdminGetUserLevelsApiArg = void
export type ListWorldAccessModesApiResponse = /** status 200  */ ('Private' | 'PublicRead' | 'PublicEdit')[]
export type ListWorldAccessModesApiArg = void
export type ListCalendarTemplatesApiResponse = /** status 200  */ {
	keys: ('earth_current' | 'martian' | 'pf2e_current' | 'rimworld' | 'exether')[]
	templates: {
		name: string
		description: string
		id: string
	}[]
}
export type ListCalendarTemplatesApiArg = void
export type ListCalendarUnitFormatModesApiResponse = /** status 200  */ (
	'Name' | 'NameOneIndexed' | 'Numeric' | 'NumericOneIndexed' | 'Hidden'
)[]
export type ListCalendarUnitFormatModesApiArg = void
export type ListImageGenerationModelsApiResponse = /** status 200  */ {
	models: {
		id: string
		name: string
	}[]
}
export type ListImageGenerationModelsApiArg = void
export type ListFeatureFlagsApiResponse = /** status 200  */ {
	featureFlags: 'MindmapRework'[]
}
export type ListFeatureFlagsApiArg = void
export type SendContactFormMessageApiResponse = unknown
export type SendContactFormMessageApiArg = {
	body: {
		name?: string
		email?: string
		message: string
		source?: string
	}
}
export type GetEntityContentApiResponse = /** status 200  */ {
	contentHtml: string
}
export type GetEntityContentApiArg = {
	/** Any string value */
	worldId: string
	entityType: 'actor' | 'event' | 'article' | 'node'
	/** Any string value */
	entityId: string
}
export type PutEntityContentApiResponse = unknown
export type PutEntityContentApiArg = {
	/** Any string value */
	worldId: string
	entityType: 'actor' | 'event' | 'article' | 'node'
	/** Any string value */
	entityId: string
	body: {
		content: string
		reloadClients?: boolean
	}
}
export type GetEntityContentPageApiResponse = /** status 200  */ {
	contentHtml: string
}
export type GetEntityContentPageApiArg = {
	/** Any string value */
	worldId: string
	entityType: 'actor' | 'event' | 'article' | 'node'
	/** Any string value */
	entityId: string
	/** Any string value */
	pageId: string
}
export type PutEntityContentPageApiResponse = unknown
export type PutEntityContentPageApiArg = {
	/** Any string value */
	worldId: string
	entityType: 'actor' | 'event' | 'article' | 'node'
	/** Any string value */
	entityId: string
	/** Any string value */
	pageId: string
	body: {
		content: string
		reloadClients?: boolean
	}
}
export type DeleteEntityContentPageApiResponse = unknown
export type DeleteEntityContentPageApiArg = {
	/** Any string value */
	worldId: string
	entityType: 'actor' | 'event' | 'article' | 'node'
	/** Any string value */
	entityId: string
	/** Any string value */
	pageId: string
}
export type CreateEntityContentPageApiResponse = /** status 200  */ {
	id: string
	createdAt: string
	updatedAt: string
	name: string
	content: string
	contentRich: string
	parentType: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
	parentActorId?: null | string
	parentEventId?: null | string
	parentArticleId?: null | string
	parentNodeId?: null | string
}
export type CreateEntityContentPageApiArg = {
	/** Any string value */
	worldId: string
	entityType: 'actor' | 'event' | 'article' | 'node'
	/** Any string value */
	entityId: string
	body: {
		name: string
	}
}
export type GetHealthApiResponse = unknown
export type GetHealthApiArg = void
export type GetApiHealthApiResponse = unknown
export type GetApiHealthApiArg = void
export type GetSupportedImageFormatsApiResponse = /** status 200  */ {
	formats: ('webp' | 'jpeg' | 'png' | 'gif')[]
}
export type GetSupportedImageFormatsApiArg = void
export type RequestImageConversionApiResponse = /** status 200  */ {
	id: string
	createdAt: string
	updatedAt: string
	ownerId: string
	size: number
	expiresAt?: null | string
	bucketKey: string
	originalFileName: string
	originalFileExtension: string
	contentType:
		| 'Avatar'
		| 'ImageConversion'
		| 'ImageGeneration'
		| 'DataMigrationExport'
		| 'DataMigrationImport'
		| 'ImageEmbed'
	status: 'Pending' | 'Finalized' | 'Failed'
	contentDescription?: null | string
	imageWidth?: null | number
	imageHeight?: null | number
}
export type RequestImageConversionApiArg = {
	body: {
		assetId: string
		format: 'webp' | 'jpeg' | 'png' | 'gif'
		width?: number
		height?: number
		quality?: number
	}
}
export type ListWorldShareLinksApiResponse = /** status 200  */ {
	worldId: string
	id: string
	createdAt: string
	accessMode: 'ReadOnly' | 'Editing'
	expiresAt: null | string
	label: null | string
	slug: string
	usageCount: number
}[]
export type ListWorldShareLinksApiArg = {
	/** Any string value */
	worldId: string
}
export type GenerateFreeWorldShareLinkApiResponse = /** status 200  */ {
	slug: string
	preferredSlugFree: boolean
}
export type GenerateFreeWorldShareLinkApiArg = {
	/** Any string value */
	worldId: string
	body: {
		preferredSlug?: string
	}
}
export type CreateWorldShareLinkApiResponse = /** status 200  */ {
	worldId: string
	id: string
	createdAt: string
	updatedAt: string
	accessMode: 'ReadOnly' | 'Editing'
	expiresAt?: null | string
	label?: null | string
	slug: string
	usageCount: number
}
export type CreateWorldShareLinkApiArg = {
	/** Any string value */
	worldId: string
	body: {
		slug: string
		label: string
		expiresAt?: string
		accessMode: 'ReadOnly' | 'Editing'
	}
}
export type ExpireWorldShareLinkApiResponse = unknown
export type ExpireWorldShareLinkApiArg = {
	/** Any string value */
	worldId: string
	/** Any string value */
	shareLinkId: string
}
export type DeleteWorldShareLinkApiResponse = unknown
export type DeleteWorldShareLinkApiArg = {
	/** Any string value */
	worldId: string
	/** Any string value */
	shareLinkId: string
}
export type VisitWorldShareLinkApiResponse = /** status 200  */ {
	world: {
		id: string
		name: string
		description: string
	}
	linkAccess: 'ReadOnly' | 'Editing'
	alreadyHasAccess: boolean
}
export type VisitWorldShareLinkApiArg = {
	/** Any string value */
	slug: string
}
export type AcceptWorldShareLinkApiResponse = /** status 200  */ {
	world: {
		id: string
		name: string
		description: string
	}
	linkAccess: 'ReadOnly' | 'Editing'
	alreadyHasAccess: boolean
}
export type AcceptWorldShareLinkApiArg = {
	/** Any string value */
	slug: string
}
export type UpdateArticleApiResponse = /** status 200  */ {
	worldId: string
	id: string
	createdAt: string
	updatedAt: string
	name: string
	icon: string
	color: string
	content: string
	contentRich: string
	parentFolderId?: null | string
	parentFolderPosition: number
}
export type UpdateArticleApiArg = {
	/** Any string value */
	worldId: string
	/** Any string value */
	articleId: string
	body: {
		name?: string
		icon?: string
		color?: string
	}
}
export type GetArticleBacklinksApiResponse = /** status 200  */ {
	type: 'Actor' | 'Event' | 'Article' | 'Tag' | 'Node'
	id: string
	name: string
}[]
export type GetArticleBacklinksApiArg = {
	/** Any string value */
	worldId: string
	/** Any string value */
	articleId: string
}
export type GetUserWorldAccessLevelApiResponse = /** status 200  */ {
	owner: boolean
	write: boolean
	read: boolean
}
export type GetUserWorldAccessLevelApiArg = {
	/** Any string value with at least one character */
	userId: string
	/** Any string value with at least one character */
	worldId: string
}
export const {
	useAdminGetUserLevelsQuery,
	useLazyAdminGetUserLevelsQuery,
	useListWorldAccessModesQuery,
	useLazyListWorldAccessModesQuery,
	useListCalendarTemplatesQuery,
	useLazyListCalendarTemplatesQuery,
	useListCalendarUnitFormatModesQuery,
	useLazyListCalendarUnitFormatModesQuery,
	useListImageGenerationModelsQuery,
	useLazyListImageGenerationModelsQuery,
	useListFeatureFlagsQuery,
	useLazyListFeatureFlagsQuery,
	useSendContactFormMessageMutation,
	useGetEntityContentQuery,
	useLazyGetEntityContentQuery,
	usePutEntityContentMutation,
	useGetEntityContentPageQuery,
	useLazyGetEntityContentPageQuery,
	usePutEntityContentPageMutation,
	useDeleteEntityContentPageMutation,
	useCreateEntityContentPageMutation,
	useGetHealthQuery,
	useLazyGetHealthQuery,
	useGetApiHealthQuery,
	useLazyGetApiHealthQuery,
	useGetSupportedImageFormatsQuery,
	useLazyGetSupportedImageFormatsQuery,
	useRequestImageConversionMutation,
	useListWorldShareLinksQuery,
	useLazyListWorldShareLinksQuery,
	useGenerateFreeWorldShareLinkMutation,
	useCreateWorldShareLinkMutation,
	useExpireWorldShareLinkMutation,
	useDeleteWorldShareLinkMutation,
	useVisitWorldShareLinkQuery,
	useLazyVisitWorldShareLinkQuery,
	useAcceptWorldShareLinkMutation,
	useUpdateArticleMutation,
	useGetArticleBacklinksQuery,
	useLazyGetArticleBacklinksQuery,
	useGetUserWorldAccessLevelQuery,
	useLazyGetUserWorldAccessLevelQuery,
} = injectedRtkApi
