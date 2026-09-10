import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { CreateAccountApiResponse } from '@/api/authApi'
import { getSessionStorageItem, removeSessionStorageItem } from '@/app/utils/sessionStorage'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { authSlice } from '../AuthSlice'

export function useHandleUserLogin() {
	const navigate = useStableNavigate()

	const { setUser, setSessionId } = authSlice.actions
	const dispatch = useDispatch()

	const handleUserLogin = useCallback(
		async (userData: CreateAccountApiResponse) => {
			dispatch(setUser(userData.user))
			dispatch(setSessionId(userData.sessionId))

			const visitedShareLinkSlug = getSessionStorageItem<string>('visitedShareLinkSlug')
			if (visitedShareLinkSlug) {
				removeSessionStorageItem('visitedShareLinkSlug')
				navigate({ to: '/share/$shareLinkSlug', params: { shareLinkSlug: visitedShareLinkSlug } })
				return
			}
			navigate({ to: '/' })
		},
		[dispatch, navigate, setSessionId, setUser],
	)

	return handleUserLogin
}
