import { useSelector } from 'react-redux'

import { useCheckAuthenticationQuery } from '@/api/authApi'
import { useGetWorldsQuery } from '@/api/worldListApi'
import { getAuthState } from '@/app/features/auth/AuthSliceSelectors'

export function useWorldListData() {
	const { user } = useSelector(getAuthState)
	const { data: authData, isLoading: isAuthLoading } = useCheckAuthenticationQuery()
	const isAuthenticated = !!user || !!authData?.authenticated

	const { data, error, isFetching } = useGetWorldsQuery(undefined, {
		skip: !isAuthenticated,
		refetchOnMountOrArgChange: true,
	})

	return {
		isLoading: isAuthLoading || (isAuthenticated && !data && !error),
		isFetching,
		isReady: !!data,
		ownedWorlds: data?.ownedWorlds ?? [],
		contributableWorlds: data?.contributableWorlds ?? [],
		visibleWorlds: data?.visibleWorlds ?? [],
	}
}
