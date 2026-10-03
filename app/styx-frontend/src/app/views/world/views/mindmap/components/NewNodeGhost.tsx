import Box from '@mui/material/Box'

import { BoxedWikiEntity } from '../../wiki/hooks/useBoxedWikiContent'
import { MindmapState } from '../MindmapState'
import { MindmapNodeContent } from '../workspace/content/nodes/content/MindmapNodeContent'

type Props = {
	entityHandle: BoxedWikiEntity
}

export function NewNodeGhost({ entityHandle }: Props) {
	return (
		<Box sx={{ transform: `scale(${MindmapState.scale})` }}>
			<MindmapNodeContent nodeId={'ghost-id'} parent={entityHandle} />
		</Box>
	)
}
