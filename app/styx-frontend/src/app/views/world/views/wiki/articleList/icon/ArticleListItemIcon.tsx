import { EntityInitialsTile } from '@/app/components/EntityInitialsTile'
import { getAccentColor } from '@/app/utils/colors/getAccentColor'
import { MindmapNodeParentParcel } from '@/app/views/world/views/mindmap/types'
import { CustomEntityIcon } from '@/ui-lib/icons/CustomEntityIcon'
import { EntityIcon } from '@/ui-lib/icons/EntityIcon'

import { ArticleListItemCollapse } from '../ArticleListItemCollapse'

type Props = {
	article: MindmapNodeParentParcel
	highlighted: boolean
	folderCollapseIcon?: boolean
}

export function ArticleListItemIcon({ article, folderCollapseIcon }: Props) {
	if (article.type === 'folder' && folderCollapseIcon) {
		return <ArticleListItemCollapse entity={article} />
	}

	const customIcon = 'icon' in article.entity ? article.entity.icon : 'default'
	const icon =
		customIcon === 'default' ? (
			<EntityIcon variant={article.type} />
		) : (
			<CustomEntityIcon icon={customIcon} color="currentColor" />
		)

	return (
		<EntityInitialsTile name={article.name} color={article.color || getAccentColor(article.id)} icon={icon} />
	)
}
