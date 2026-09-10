import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useToggleWorldPinMutation, worldListApi } from '@/api/worldListApi'
import { getAuthState } from '@/app/features/auth/AuthSliceSelectors'
import { AppDispatch } from '@/app/store'
import { parseApiResponse } from '@/app/utils/parseApiResponse'

export function useToggleWorldPin() {
	const { user } = useSelector(getAuthState)
	const [toggleWorldPin, state] = useToggleWorldPinMutation()

	const dispatch = useDispatch<AppDispatch>()

	const perform = useCallback(
		async (worldId: string) => {
			const patch = dispatch(
				worldListApi.util.updateQueryData('getWorlds', undefined, (draft) => {
					const worlds = [...draft.ownedWorlds, ...draft.contributableWorlds, ...draft.visibleWorlds]
					const world = worlds.find((w) => w.id === worldId)
					if (!world || !user) {
						return
					}

					world.updatedAt = new Date().toISOString()
					if (world.userPins.length > 0) {
						world.userPins = []
						return
					}

					world.userPins = [
						{
							worldId,
							userId: user.id,
							createdAt: new Date().toISOString(),
							rank: worlds.filter((w) => w.userPins.length > 0).length * 2,
						},
					]
				}),
			)

			const { response, error } = parseApiResponse(await toggleWorldPin({ worldId }))

			if (error) {
				patch.undo()
				return
			}

			return response
		},
		[dispatch, toggleWorldPin, user],
	)

	return [perform, state] as const
}
