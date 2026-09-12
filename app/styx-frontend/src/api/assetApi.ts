import { baseApi as api } from './base/baseApi'
export const addTagTypes = ['asset', 'imageGeneration'] as const
const injectedRtkApi = api
	.enhanceEndpoints({
		addTagTypes,
	})
	.injectEndpoints({
		endpoints: (build) => ({
			getAsset: build.query<GetAssetApiResponse, GetAssetApiArg>({
				query: (queryArg) => ({
					url: `/api/assets/${queryArg.assetId}`,
					params: {
						disposition: queryArg.disposition,
					},
				}),
				providesTags: ['asset'],
			}),
			deleteAsset: build.mutation<DeleteAssetApiResponse, DeleteAssetApiArg>({
				query: (queryArg) => ({ url: `/api/assets/${queryArg.assetId}`, method: 'DELETE' }),
				invalidatesTags: ['asset', 'imageGeneration'],
			}),
			listUserAssets: build.query<ListUserAssetsApiResponse, ListUserAssetsApiArg>({
				query: (queryArg) => ({
					url: `/api/assets`,
					params: {
						offset: queryArg.offset,
						limit: queryArg.limit,
						sortField: queryArg.sortField,
						sortDirection: queryArg.sortDirection,
					},
				}),
				providesTags: ['asset'],
			}),
			requestPresignedUrl: build.mutation<RequestPresignedUrlApiResponse, RequestPresignedUrlApiArg>({
				query: (queryArg) => ({ url: `/api/assets/upload/presigned`, method: 'POST', body: queryArg.body }),
				invalidatesTags: ['asset'],
			}),
			finalizeAssetUpload: build.mutation<FinalizeAssetUploadApiResponse, FinalizeAssetUploadApiArg>({
				query: (queryArg) => ({ url: `/api/assets/upload/finalize`, method: 'POST', body: queryArg.body }),
				invalidatesTags: ['asset'],
			}),
		}),
		overrideExisting: false,
	})
export { injectedRtkApi as assetApi }
export type GetAssetApiResponse = /** status 200  */ {
	url: string
	imageWidth?: null | number
	imageHeight?: null | number
}
export type GetAssetApiArg = {
	/** Any string value */
	assetId: string
	disposition?: 'inline' | 'attachment'
}
export type DeleteAssetApiResponse = unknown
export type DeleteAssetApiArg = {
	/** Any string value */
	assetId: string
}
export type ListUserAssetsApiResponse = /** status 200  */ {
	assets: {
		previewUrl?: null | string
		_count: {
			references: number
		}
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
	}[]
	total: number
}
export type ListUserAssetsApiArg = {
	offset?: number
	limit?: number
	sortField?: string
	sortDirection?: 'desc' | 'asc'
}
export type RequestPresignedUrlApiResponse = /** status 200  */ {
	asset: {
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
	url: string
	fields: {
		[key: string]: string
	}
}
export type RequestPresignedUrlApiArg = {
	body: {
		fileName: string
		fileSize: number
		assetType:
			| 'Avatar'
			| 'ImageConversion'
			| 'ImageGeneration'
			| 'DataMigrationExport'
			| 'DataMigrationImport'
			| 'ImageEmbed'
	}
}
export type FinalizeAssetUploadApiResponse = /** status 200  */ {
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
export type FinalizeAssetUploadApiArg = {
	body: {
		assetId: string
	}
}
export const {
	useGetAssetQuery,
	useLazyGetAssetQuery,
	useDeleteAssetMutation,
	useListUserAssetsQuery,
	useLazyListUserAssetsQuery,
	useRequestPresignedUrlMutation,
	useFinalizeAssetUploadMutation,
} = injectedRtkApi
