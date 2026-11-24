import useEvent from 'react-use-event-hook'

import { useLazyGetMindmapQuery } from '@/api/mindmapApi'
import { useGlobalRevealInMindmap } from '@/app/features/mindmap/hooks/useGlobalRevealInMindmap'
import { useCurrentWorldId } from '@/app/views/world/hooks/useCurrentWorldId'

import { BoxedWikiEntity } from '../../wiki/hooks/useBoxedWikiContent'
import { getMindmapNodeParentId } from '../utils/getMindmapNodeParentId'

export function useRevealInMindmap(entity: BoxedWikiEntity) {
	const worldId = useCurrentWorldId()
	const [getMindmapData] = useLazyGetMindmapQuery()
	const revealEntity = useGlobalRevealInMindmap({ id: entity.id, worldId })

	return useEvent(async () => {
		const { data } = await getMindmapData({ worldId }, true)
		if (!data) {
			return
		}
		if (!data.nodes.some((node) => getMindmapNodeParentId(node) === entity.id)) {
			return
		}

		revealEntity()
	})
}
