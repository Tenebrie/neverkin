import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useGetWorldInfoQuery } from '@/api/worldDetailsApi'
import { preferencesSlice } from '@/app/features/preferences/PreferencesSlice'

import { useListArticles } from '../api/useListArticles'
import { useListFolders } from '../api/useListFolders'
import { wikiSlice } from '../views/wiki/WikiSlice'
import { worldSlice } from '../WorldSlice'
import { getWorldStateLoaded } from '../WorldSliceSelectors'

export const useLoadWorldInfo = (worldId: string) => {
	const { data, error } = useGetWorldInfoQuery(
		{
			worldId: worldId,
		},
		{
			refetchOnReconnect: true,
			refetchOnMountOrArgChange: true,
		},
	)
	const { data: articles } = useListArticles()
	const { data: folders } = useListFolders()

	const isLoaded = useSelector(getWorldStateLoaded)

	const { loadWorld, unloadWorld, setUnauthorized } = worldSlice.actions
	const { loadArticles, loadFolders } = wikiSlice.actions
	const { setLastOpenedWorld } = preferencesSlice.actions
	const dispatch = useDispatch()

	useEffect(() => {
		dispatch(setLastOpenedWorld(worldId))
	}, [dispatch, setLastOpenedWorld, worldId])

	useEffect(() => {
		if (error) {
			dispatch(setUnauthorized(true))
		}
	}, [dispatch, error, setUnauthorized])

	useEffect(() => {
		dispatch(unloadWorld())
	}, [dispatch, unloadWorld, worldId])

	useEffect(() => {
		if (!data) {
			return
		}

		if (!Number.isFinite(Number(data.timeOrigin))) {
			throw new Error('Time origin too large!')
		}

		dispatch(
			loadWorld({
				world: data,
			}),
		)
	}, [data, dispatch, loadWorld])

	useEffect(() => {
		dispatch(loadArticles({ articles: articles ?? [] }))
	}, [articles, dispatch, loadArticles])

	useEffect(() => {
		dispatch(loadFolders({ folders: folders ?? [] }))
	}, [folders, dispatch, loadFolders])

	return {
		isLoaded,
	}
}
