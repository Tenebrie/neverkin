import Box from '@mui/material/Box'

import { BoxedWikiEntity } from '../../wiki/hooks/useBoxedWikiContent'
import { MindmapState } from '../MindmapState'
import { ActorNodeContent } from '../workspace/content/nodes/content/ActorNodeContent'

type Props = {
	entityHandle: BoxedWikiEntity
}

export function NewNodeGhost({ entityHandle }: Props) {
	return (
		<Box sx={{ transform: `scale(${MindmapState.scale})` }}>
			<ActorNodeContent nodeId={'ghost-id'} parent={entityHandle} />
		</Box>
	)
}
