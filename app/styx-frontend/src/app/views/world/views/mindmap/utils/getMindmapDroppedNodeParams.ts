import { getGhostElementRect } from '@/app/features/dragDrop/components/GhostWrapper'

import { BoxedWikiEntity } from '../../wiki/hooks/useBoxedWikiContent'
import { getMindmapGridPosition } from './getMindmapGridPosition'

export function getMindmapDroppedNodeParams(entity: BoxedWikiEntity, targetPos: { x: number; y: number }) {
	const gridPos = getMindmapGridPosition({ screenX: targetPos.x, screenY: targetPos.y })
	if (!gridPos) {
		return null
	}

	const ghostRect = getGhostElementRect()
	return {
		positionX: Math.round(gridPos.x - (ghostRect ? ghostRect.width / 2 : 0)),
		positionY: Math.round(gridPos.y - (ghostRect ? ghostRect.height / 2 : 0)),
		parentActorId: entity.type === 'actor' ? entity.id : undefined,
		parentArticleId: entity.type === 'article' ? entity.id : undefined,
		parentEventId: entity.type === 'event' ? entity.id : undefined,
		parentFolderId: entity.type === 'folder' ? entity.id : undefined,
		parentTagId: entity.type === 'tag' ? entity.id : undefined,
	}
}
