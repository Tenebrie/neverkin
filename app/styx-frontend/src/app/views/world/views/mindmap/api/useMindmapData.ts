import { GetMindmapApiResponse, useGetMindmapQuery } from '@/api/mindmapApi'

import { useCurrentWorldId } from '../../../hooks/useCurrentWorldId'

const emptyData = {
	nodes: [],
	wires: [],
} as GetMindmapApiResponse

export function useMindmapData() {
	const worldId = useCurrentWorldId()
	const { data } = useGetMindmapQuery({ worldId })
	if (!data) {
		return emptyData
	}

	return data
}
