import { baseApi as api } from './base/baseApi'
export const addTagTypes = ['auth', 'worldList', 'worldDetails', 'announcementList', 'adminUsers'] as const
const injectedRtkApi = api
	.enhanceEndpoints({
		addTagTypes,
	})
	.injectEndpoints({
		endpoints: (build) => ({
			checkAuthentication: build.query<CheckAuthenticationApiResponse, CheckAuthenticationApiArg>({
				query: () => ({ url: `/api/auth/check` }),
				providesTags: ['auth'],
			}),
			createAccount: build.mutation<CreateAccountApiResponse, CreateAccountApiArg>({
				query: (queryArg) => ({ url: `/api/auth`, method: 'POST', body: queryArg.body }),
				invalidatesTags: ['auth', 'worldList', 'worldDetails', 'announcementList'],
			}),
			deleteAccount: build.mutation<DeleteAccountApiResponse, DeleteAccountApiArg>({
				query: () => ({ url: `/api/auth`, method: 'DELETE' }),
				invalidatesTags: ['auth', 'worldList', 'worldDetails', 'announcementList'],
			}),
			createGuestAccount: build.mutation<CreateGuestAccountApiResponse, CreateGuestAccountApiArg>({
				query: () => ({ url: `/api/auth/guest`, method: 'POST' }),
				invalidatesTags: ['auth', 'worldList', 'worldDetails', 'announcementList'],
			}),
			loginWithGoogle: build.mutation<LoginWithGoogleApiResponse, LoginWithGoogleApiArg>({
				query: (queryArg) => ({ url: `/api/auth/google`, method: 'POST', body: queryArg.body }),
				invalidatesTags: ['auth', 'worldList', 'worldDetails', 'announcementList'],
			}),
			postLogin: build.mutation<PostLoginApiResponse, PostLoginApiArg>({
				query: (queryArg) => ({ url: `/api/auth/login`, method: 'POST', body: queryArg.body }),
				invalidatesTags: ['auth', 'worldList', 'worldDetails', 'announcementList', 'adminUsers'],
			}),
			postLogout: build.mutation<PostLogoutApiResponse, PostLogoutApiArg>({
				query: () => ({ url: `/api/auth/logout`, method: 'POST' }),
				invalidatesTags: ['auth', 'worldList', 'worldDetails', 'announcementList'],
			}),
		}),
		overrideExisting: false,
	})
export { injectedRtkApi as authApi }
export type CheckAuthenticationApiResponse =
	| /** status 200  */ {
			authenticated: boolean
			sessionId: string
	  }
	| {
			authenticated: boolean
			sessionId: string
			user: {
				id: string
				email: string
				username: string
				level: 'Guest' | 'Free' | 'Premium' | 'Admin'
				bio: string
				avatarUrl?: string
				featureFlags: 'MindmapRework'[]
			}
	  }
export type CheckAuthenticationApiArg = void
export type CreateAccountApiResponse = /** status 200  */ {
	user: {
		featureFlags: 'MindmapRework'[]
		avatarUrl?: string
		id: string
		email: string
		username: string
		bio: string
		level: 'Guest' | 'Free' | 'Premium' | 'Admin'
	}
	sessionId: string
}
export type CreateAccountApiArg = {
	body: {
		email: string
		username: string
		password: string
	}
}
export type DeleteAccountApiResponse = unknown
export type DeleteAccountApiArg = void
export type CreateGuestAccountApiResponse = /** status 200  */ {
	user: {
		featureFlags: 'MindmapRework'[]
		avatarUrl?: string
		id: string
		email: string
		username: string
		bio: string
		level: 'Guest' | 'Free' | 'Premium' | 'Admin'
	}
	sessionId: string
}
export type CreateGuestAccountApiArg = void
export type LoginWithGoogleApiResponse = /** status 200  */ {
	user: {
		featureFlags: 'MindmapRework'[]
		avatarUrl?: string
		id: string
		email: string
		username: string
		bio: string
		level: 'Guest' | 'Free' | 'Premium' | 'Admin'
	}
	sessionId: string
}
export type LoginWithGoogleApiArg = {
	body: {
		googleToken: string
	}
}
export type PostLoginApiResponse = /** status 200  */ {
	user: {
		featureFlags: 'MindmapRework'[]
		avatarUrl?: string
		id: string
		email: string
		username: string
		bio: string
		level: 'Guest' | 'Free' | 'Premium' | 'Admin'
		avatar: null | {
			id: string
			createdAt: string
			updatedAt: string
			size: number
			ownerId: string
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
	}
	sessionId: string
}
export type PostLoginApiArg = {
	body: {
		email: string
		password: string
	}
}
export type PostLogoutApiResponse = /** status 200  */ {
	redirectTo: 'admin' | 'login'
}
export type PostLogoutApiArg = void
export const {
	useCheckAuthenticationQuery,
	useLazyCheckAuthenticationQuery,
	useCreateAccountMutation,
	useDeleteAccountMutation,
	useCreateGuestAccountMutation,
	useLoginWithGoogleMutation,
	usePostLoginMutation,
	usePostLogoutMutation,
} = injectedRtkApi
