import { retry } from '@reduxjs/toolkit/query'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { RootState } from '@/app/store'
import { parseApiError } from '@/app/utils/parseApiError'
import { isRunningInTest } from '@/test-utils/isRunningInTest'
import { SESSION_HEADER_NAME } from '@/ts-shared/const/constants'

const baseQuery = fetchBaseQuery({
	baseUrl: isRunningInTest() ? 'http://fakelocalhost/' : '/',
	prepareHeaders: (headers, { getState }) => {
		const sessionId = (getState() as RootState).auth.sessionId
		if (sessionId) {
			headers.set(SESSION_HEADER_NAME, sessionId)
		}
		return headers
	},
})

const debugBaseQuery: typeof baseQuery = async (args, api, extraOptions) => {
	try {
		const result = await baseQuery(args, api, extraOptions)
		return result
	} catch (e) {
		console.error('fetchBaseQuery:', e)
		throw e
	}
}

const baseQueryWithRetry = retry(debugBaseQuery, {
	backoff(attempt: number) {
		const baseDelay = 1000 // base delay in ms
		const delay = baseDelay * Math.pow(2, attempt) // exponential increase
		const jitter = Math.random() * 500 // add up to 500ms of random jitter
		return new Promise((resolve) => setTimeout(resolve, delay + jitter))
	},
	retryCondition(baseError, _, extraArgs) {
		const error = parseApiError(baseError)
		if (error.status < 500) {
			return false
		}

		let maxRetries = 3
		if (error.status === 502) {
			maxRetries = 5
		}

		return extraArgs.attempt < maxRetries
	},
})

export const baseApi = createApi({
	baseQuery: baseQueryWithRetry,
	refetchOnReconnect: true,
	endpoints: () => ({}),
})

export const BaseApiReducer = baseApi.reducer
