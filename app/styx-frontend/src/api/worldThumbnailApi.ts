import { baseApi as api } from './base/baseApi'
export const addTagTypes = [] as const
const injectedRtkApi = api
	.enhanceEndpoints({
		addTagTypes,
	})
	.injectEndpoints({
		endpoints: (build) => ({}),
		overrideExisting: false,
	})
export { injectedRtkApi as worldThumbnailApi }
export const {} = injectedRtkApi
