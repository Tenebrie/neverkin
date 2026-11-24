import { useGetFoldersQuery } from '@/api/worldWikiFolderApi'

import { useCurrentWorldId } from '../hooks/useCurrentWorldId'

export function useListFolders() {
	const worldId = useCurrentWorldId()
	return useGetFoldersQuery({ worldId })
}
