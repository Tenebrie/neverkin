import { useSelector } from 'react-redux'

import { useStableNavigate } from '@/router-utils/hooks/useStableNavigate'

import { ArticleListItemIcon } from '../articleList/icon/ArticleListItemIcon'
import { BoxedWikiEntity } from '../hooks/useBoxedWikiContent'
import { getWikiState } from '../WikiSliceSelectors'
import { WikiLandingRow } from './WikiLandingRow'
import { WikiLandingRowTimestamp } from './WikiLandingRowTimestamp'

type Props = {
	entity: BoxedWikiEntity
	openedAt?: number
}

export function WikiLandingEntityRow({ entity, openedAt }: Props) {
	const { folders } = useSelector(getWikiState, (a, b) => a.folders === b.folders)
	const navigate = useStableNavigate({ from: '/world/$worldId' })

	return (
		<WikiLandingRow
			icon={<ArticleListItemIcon article={entity} highlighted={false} />}
			label={entity.name}
			meta={folders.find((folder) => folder.id === entity.entity.parentFolderId)?.name}
			onClick={() =>
				navigate({ to: '/world/$worldId/wiki/$articleId', params: { articleId: entity.id }, search: true })
			}
		>
			<WikiLandingRowTimestamp date={new Date(openedAt ?? entity.entity.updatedAt)} />
		</WikiLandingRow>
	)
}
