import Box from '@mui/material/Box'
import { useSelector } from 'react-redux'

import { EntityIcon } from '@/ui-lib/icons/EntityIcon'

import { getWikiState } from '../WikiSliceSelectors'

type Props = {
	folderId: string | null | undefined
	height?: number
}

export function WikiLandingFolderLabel({ folderId, height = 16 }: Props) {
	const { folders } = useSelector(getWikiState, (a, b) => a.folders === b.folders)
	const folder = folders.find((folder) => folder.id === folderId)

	if (!folder) {
		return null
	}

	return (
		<Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
			<EntityIcon variant="folder" height={height} />
			<Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
				{folder.name}
			</Box>
		</Box>
	)
}
