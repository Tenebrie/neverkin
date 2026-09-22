import Box from '@mui/material/Box'

import { BoxedWikiEntity } from '../../wiki/hooks/useBoxedWikiContent'
import { MindmapState } from '../utils/MindmapState'
import { ActorNodeContent } from '../workspace/ActorNodeContent'

type Props = {
	entityHandle: BoxedWikiEntity
}

export function NewNodeGhost({ entityHandle }: Props) {
	return (
		<Box sx={{ transform: `scale(${MindmapState.scale})` }}>
			<ActorNodeContent parent={entityHandle} />
		</Box>
	)
}
