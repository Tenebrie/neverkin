import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import useEvent from 'react-use-event-hook'

import { MindmapNode } from '@/api/types/mindmapTypes'
import { useBrowserSpecificScrollbars } from '@/app/hooks/useBrowserSpecificScrollbars'
import { useUpdateMindmapNode } from '@/app/views/world/views/mindmap/api/useUpdateMindmapNode'
import { ArticleListItemIcon } from '@/app/views/world/views/wiki/articleList/icon/ArticleListItemIcon'
import { boxPlainNode } from '@/app/views/world/views/wiki/utils/boxEntity'
import { EditableTitle } from '@/ui-lib/components/EditableTitle/EditableTitle'

import { NodeDescription } from './NodeDescription'

type Props = {
	node: MindmapNode
	titleProps?: Partial<Parameters<typeof EditableTitle>[0]>
	surface?: string
}

export const NodeDetails = ({ node, titleProps, surface }: Props) => {
	const [updateMindmapNode] = useUpdateMindmapNode()

	const onSave = useEvent((name: string) => {
		updateMindmapNode(node.id, { name })
	})

	const scrollbars = useBrowserSpecificScrollbars()

	return (
		<Stack
			gap={1}
			sx={{
				height: 'calc(100% - 1px)',
				...scrollbars,
			}}
		>
			<EditableTitle
				value={node.name}
				onSave={onSave}
				{...titleProps}
				startAdornment={
					<Stack sx={{ height: 1, marginRight: 0.5 }} direction="row">
						{titleProps?.startAdornment}
						<ArticleListItemIcon article={boxPlainNode(node)} highlighted={false} />
					</Stack>
				}
			/>
			<Divider />
			<Box flexGrow={1} height={0}>
				<NodeDescription node={node} surface={surface} />
			</Box>
		</Stack>
	)
}
