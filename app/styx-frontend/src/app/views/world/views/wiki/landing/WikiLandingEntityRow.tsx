import Box from '@mui/material/Box'

import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { ArticleListItemIcon } from '../articleList/icon/ArticleListItemIcon'
import { BoxedWikiEntity } from '../hooks/useBoxedWikiContent'
import { WikiLandingFolderLabel } from './WikiLandingFolderLabel'
import { WikiLandingRow } from './WikiLandingRow'
import { WikiLandingRowTimestamp } from './WikiLandingRowTimestamp'

type Props = {
	entity: BoxedWikiEntity
	openedAt?: number
}

export function WikiLandingEntityRow({ entity, openedAt }: Props) {
	const navigate = useStableNavigate({ from: '/world/$worldId' })

	return (
		<WikiLandingRow
			icon={
				<Box sx={{ height: 28 }}>
					<ArticleListItemIcon article={entity} highlighted={false} />
				</Box>
			}
			label={entity.name}
			meta={<WikiLandingFolderLabel folderId={entity.entity.parentFolderId} />}
			onClick={() =>
				navigate({ to: '/world/$worldId/wiki/$articleId', params: { articleId: entity.id }, search: true })
			}
		>
			<WikiLandingRowTimestamp date={new Date(openedAt ?? entity.entity.updatedAt)} />
		</WikiLandingRow>
	)
}
