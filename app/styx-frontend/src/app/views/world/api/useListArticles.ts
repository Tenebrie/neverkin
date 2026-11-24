import { useGetArticlesQuery } from '@/api/worldWikiApi'

import { useCurrentWorldId } from '../hooks/useCurrentWorldId'

export const useListArticles = () => {
	const worldId = useCurrentWorldId()
	return useGetArticlesQuery({ worldId })
}
