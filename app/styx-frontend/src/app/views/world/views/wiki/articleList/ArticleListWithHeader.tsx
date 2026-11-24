import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { useRef } from 'react'

import { useOutlinerRevealReceiver } from '@/app/features/outliner/hooks/useOutlinerRevealReceiver'

import { ArticleList } from './ArticleList'
import { ArticleListEntityGroupButton } from './ArticleListEntityGroupButton'
import { ArticleListHeader } from './ArticleListHeader'

export function ArticleListWithHeader() {
	const ref = useRef<HTMLDivElement>(null)
	useOutlinerRevealReceiver(ref)

	return (
		<Stack
			ref={ref}
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
}
