import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import useEvent from 'react-use-event-hook'

import { WikiArticle } from '@/api/types/worldWikiTypes'
import { useBrowserSpecificScrollbars } from '@/app/hooks/useBrowserSpecificScrollbars'
import { useUpdateArticle } from '@/app/views/world/api/useUpdateArticle'
import { EditableTitle } from '@/ui-lib/components/EditableTitle/EditableTitle'

import { EntityEditorTabs } from '../../common/EntityEditorTabs'
import { ArticleDescription } from './ArticleDescription'
import { ArticleBacklinks } from './components/ArticleBacklinks'

type Props = {
	article: WikiArticle
	titleProps?: Partial<Parameters<typeof EditableTitle>[0]>
	isWikiTab?: boolean
	surface?: string
}

export const ArticleDetails = ({ article, titleProps, isWikiTab, surface }: Props) => {
	const [updateArticle] = useUpdateArticle()

	const onSave = useEvent((name: string) => {
		updateArticle(article.id, { name })
	})

	const scrollbars = useBrowserSpecificScrollbars()
	const fluidHeight = surface === 'wiki'

	return (
		<Stack
			gap={1}
			sx={{
				height: fluidHeight ? 'auto' : 'calc(100% - 1px)',
				...scrollbars,
			}}
		>
			<EditableTitle value={article.name} onSave={onSave} {...titleProps} />
			<Divider />
			<Box flexGrow={1} height={fluidHeight ? 'auto' : 0}>
				<EntityEditorTabs
					contentTab={<ArticleDescription article={article} surface={surface} />}
					backlinksTab={<ArticleBacklinks articleId={article.id} />}
					isWikiTab={isWikiTab}
					fluidHeight={fluidHeight}
				/>
			</Box>
		</Stack>
	)
}
