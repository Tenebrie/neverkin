import { WikiEntityType } from '@/api/types/worldTypes'
import { EntityInitialsTile } from '@/app/components/EntityInitialsTile'
import { getAccentColor } from '@/app/utils/colors/getAccentColor'
import { CustomEntityIcon } from '@/ui-lib/icons/CustomEntityIcon'
import { EntityIcon } from '@/ui-lib/icons/EntityIcon'

import { ArticleListItemFolderCollapse } from '../ArticleListItemFolderCollapse'

type Props = {
	article: {
		id: string
		name: string
		type: WikiEntityType | 'node'
		icon: string | undefined
		color: string | undefined
	}
	highlighted: boolean
	folderCollapseIcon?: boolean
}

export function ArticleListItemIcon({ article, folderCollapseIcon }: Props) {
	if (article.type === 'folder' && folderCollapseIcon) {
		return <ArticleListItemFolderCollapse id={article.id} />
	}

	const customIcon = article.icon ?? 'default'
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
