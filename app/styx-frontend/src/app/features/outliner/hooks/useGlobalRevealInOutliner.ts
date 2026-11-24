import { useDispatch } from 'react-redux'
import useEvent from 'react-use-event-hook'

import { useMobileLayout } from '@/app/hooks/useMobileLayout'
import { useCurrentWorldIdOptional } from '@/app/views/world/hooks/useCurrentWorldIdOptional'
import { wikiSlice } from '@/app/views/world/views/wiki/WikiSlice'
import { useCheckRouteMatch } from '@/router-utils/hooks/useCheckRouteMatch'
import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

type Props = {
	id: string
	worldId: string
}

export function useGlobalRevealInOutliner({ id, worldId }: Props) {
	const dispatch = useDispatch()
	const navigate = useStableNavigate({})
	const currentWorldId = useCurrentWorldIdOptional()
	const { isMobile } = useMobileLayout()
	const isWiki = useCheckRouteMatch('/world/$worldId/wiki')
	const isMindmap = useCheckRouteMatch('/world/$worldId/mindmap')

	return useEvent(() => {
		dispatch(
			wikiSlice.actions.setPendingReveal({
				entityId: id,
				worldId,
			}),
		)

		const isRightWorld = currentWorldId === worldId
		const isOutlinerOnRoute = isWiki || isMindmap
		if (isRightWorld && isOutlinerOnRoute && !isMobile) {
			return
		}

		navigate({
			to: '/world/$worldId/wiki',
			params: {
				worldId,
			},
			search: isRightWorld ? true : {},
		})
	})
}
