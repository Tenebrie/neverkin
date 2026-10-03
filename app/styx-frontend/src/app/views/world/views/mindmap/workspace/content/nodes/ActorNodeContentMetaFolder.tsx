import Inventory2 from '@mui/icons-material/Inventory2'

import { useFolderItemCount } from '@/app/views/world/views/wiki/hooks/useFolderItemCount'

type Props = {
	folderId: string
}

export function ActorNodeContentMetaFolder({ folderId }: Props) {
	const folderItemCount = useFolderItemCount(folderId)

	return (
		<>
			<Inventory2 sx={{ fontSize: '1rem' }} />
			{folderItemCount} item{folderItemCount === 1 ? '' : 's'}
		</>
	)
}
