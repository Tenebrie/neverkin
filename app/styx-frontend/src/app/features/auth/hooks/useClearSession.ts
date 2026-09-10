import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { baseApi } from '@/api/base/baseApi'

import { authSlice } from '../AuthSlice'

/**
 * Ends the current session. The RTK Query cache is keyed by endpoint rather than by user, so it has
 * to be dropped along with the user - otherwise the next account to sign in reads the previous
 * account's cached responses until each query refetches.
 */
export const useClearSession = () => {
	const { clearUser } = authSlice.actions
	const dispatch = useDispatch()

	return useCallback(() => {
		dispatch(clearUser())
		dispatch(baseApi.util.resetApiState())
	}, [clearUser, dispatch])
}
