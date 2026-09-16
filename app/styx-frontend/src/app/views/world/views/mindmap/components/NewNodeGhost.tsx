import Box from '@mui/material/Box'

import { BoxedWikiEntity } from '../../wiki/hooks/useBoxedWikiContent'
import { getMindmapGridScale } from '../utils/getMindmapGridScale'
import { ActorNodeContent } from '../workspace/ActorNodeContent'

type Props = {
	entityHandle: BoxedWikiEntity
}

export function NewNodeGhost({ entityHandle }: Props) {
	const scale = getMindmapGridScale()
	if (scale === null) {
		return null
	}
	return (
		<Box sx={{ transform: `scale(${scale})` }}>
			<ActorNodeContent parent={entityHandle} />
		</Box>
	)
}
