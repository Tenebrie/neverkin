import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import { Outlet } from '@tanstack/react-router'

import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'
import { useMobileLayout } from '@/app/hooks/useMobileLayout'
import { useCheckRouteMatch } from '@/router-utils/hooks/useCheckRouteMatch'

import { ArticleListWithHeader } from './articleList/ArticleListWithHeader'

export function Wiki() {
	const theme = useCustomTheme()
	const isArticle = useCheckRouteMatch('/world/$worldId/wiki/$articleId')
	const { isMobile } = useMobileLayout()

	const showList = !isMobile || !isArticle
	const showContent = !isMobile || isArticle

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
					<ArticleListWithHeader />
				</Paper>
			)}
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
