import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { Outlet } from '@tanstack/react-router'

import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { useMobileLayout } from '@/app/hooks/useMobileLayout'
import { WikiOutlinerDrawer } from '@/app/views/world/components/WikiOutlinerDrawer'
import { useCheckRouteMatch } from '@/router-utils/hooks/useCheckRouteMatch'

import { ArticleList } from './articleList/ArticleList'
import { ArticleListEntityGroupButton } from './articleList/ArticleListEntityGroupButton'
import { ArticleListHeader } from './articleList/ArticleListHeader'

export function Wiki() {
	const theme = useCustomTheme()
	const isArticle = useCheckRouteMatch('/world/$worldId/wiki/$articleId')
	const { isMobile } = useMobileLayout()

	const showList = !isMobile || !isArticle
	const showContent = !isMobile || isArticle

	const articleList = (
		<Stack
			sx={{
				width: '100%',
				minWidth: 0,
				height: '100%',
			}}
			data-testid="ArticleListWithHeader"
		>
			<Stack gap={1} height={1}>
				<Stack gap={1}>
					<ArticleListHeader />
					<Divider />
					<ArticleListEntityGroupButton />
				</Stack>
				<ArticleList parentId={null} depth={0} />
			</Stack>
		</Stack>
	)

	return (
		<Stack
			sx={{
				width: '100%',
				height: '100%',
				alignItems: isMobile ? 'flex-start' : 'stretch',
				flexDirection: isMobile ? 'column' : 'row',
				gap: isMobile ? 2 : 0,
				overflowX: 'hidden',
				overflowY: isMobile ? 'auto' : undefined,
				background: theme.custom.palette.background.textEditor,
			}}
		>
			{isMobile && showList && (
				<Paper
					sx={{
						padding: 2,
						paddingTop: '24px',
						paddingBottom: 0,
						height: '100%',
						maxHeight: '100%',
						width: '100%',
						boxSizing: 'border-box',
						display: 'flex',
						flexDirection: 'row',
						borderRadius: 0,
						overflowX: 'hidden',
					}}
					elevation={1}
				>
					{articleList}
				</Paper>
			)}
			{!isMobile && <WikiOutlinerDrawer>{articleList}</WikiOutlinerDrawer>}
			{showContent && (
				<Stack
					sx={{
						flex: 1,
						minWidth: 0,
						width: '100%',
						height: '100%',
					}}
				>
					{isArticle && <Outlet />}
				</Stack>
			)}
		</Stack>
	)
}
