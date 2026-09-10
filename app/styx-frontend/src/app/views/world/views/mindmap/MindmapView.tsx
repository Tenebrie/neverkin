import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'

import { WikiOutlinerDrawer } from '../../components/WikiOutlinerDrawer'
import { ArticleList } from '../wiki/articleList/ArticleList'
import { ArticleListEntityGroupButton } from '../wiki/articleList/ArticleListEntityGroupButton'
import { ArticleListHeader } from '../wiki/articleList/ArticleListHeader'
import { Mindmap } from './Mindmap'

export const MindmapView = () => {
	return (
		<Stack direction="row" sx={{ width: '100%', height: '100%', overflowX: 'hidden' }}>
			<WikiOutlinerDrawer>
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
			</WikiOutlinerDrawer>
			<Box width={1} height={1} position="relative" overflow="auto">
				<Mindmap />
			</Box>
		</Stack>
	)
}
