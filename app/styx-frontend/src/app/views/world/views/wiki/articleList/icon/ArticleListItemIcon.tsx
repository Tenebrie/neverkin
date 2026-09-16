import { EntityInitialsTile } from '@/app/components/EntityInitialsTile'
import { getAccentColor } from '@/app/utils/colors/getAccentColor'
import { CustomEntityIcon } from '@/ui-lib/icons/CustomEntityIcon'
import { EntityIcon } from '@/ui-lib/icons/EntityIcon'

import { BoxedWikiEntity } from '../../hooks/useBoxedWikiContent'
import { ArticleListItemCollapse } from '../ArticleListItemCollapse'

type Props = {
	article: BoxedWikiEntity
	highlighted: boolean
	folderCollapseIcon?: boolean
}

export function ArticleListItemIcon({ article, folderCollapseIcon }: Props) {
	if (article.type === 'folder' && folderCollapseIcon) {
		return <ArticleListItemCollapse entity={article} />
	}

	const icon =
		article.type === 'event' ? (
			<CustomEntityIcon icon={article.entity.icon} color="currentColor" height={16} />
		) : (
			<EntityIcon variant={article.type} height={16} />
		)

	return (
		<EntityInitialsTile
			name={article.name}
			color={article.color || getAccentColor(article.id)}
			size={28}
			icon={icon}
		/>
	)
}
