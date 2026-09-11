import { useSelector } from 'react-redux'

import { useCheckAuthenticationQuery } from '@/api/authApi'
import { useListCalendarsQuery } from '@/api/calendarApi'
import { getAuthState } from '@/app/features/auth/AuthSliceSelectors'

export function useCalendarListData() {
	const { user } = useSelector(getAuthState)
	const { data: authData, isLoading: isAuthLoading } = useCheckAuthenticationQuery()
	const isAuthenticated = !!user || !!authData?.authenticated

	const { data, error, isFetching } = useListCalendarsQuery(undefined, {
		skip: !isAuthenticated,
		refetchOnMountOrArgChange: true,
	})

	return {
		isLoading: isAuthLoading || (isAuthenticated && !data && !error),
		isFetching,
		isReady: !!data,
		calendars: data ?? [],
	}
}
