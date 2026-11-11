import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'

import { BoxedWikiEntity } from '../hooks/useBoxedWikiContent'
import { useFolderEntityCount } from './hooks/useFolderEntityCount'

type Props = {
	article: {
		id: string
		type: BoxedWikiEntity['type'] | 'node'
	}
	color: string
}

export function ArticleListItemEndAdornment({ article, color }: Props) {
	const theme = useCustomTheme()
	const folderCount = useFolderEntityCount({ id: article.id, entityType: article.type })

	if (article.type !== 'folder') {
		return (
			<Box
				component="span"
				sx={{
					color,
					fontSize: '0.7rem',
					textTransform: 'uppercase',
					whiteSpace: 'nowrap',
					ml: 1,
					fontFamily: 'Inter',
					transition: 'color 0.1s ease-out',
				}}
			>
				{article.type}
			</Box>
		)
	}

	return (
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="center"
			sx={{
				boxSizing: 'border-box',
				minWidth: 24,
				minHeight: 24,
				maxHeight: 24,
				px: 0.75,
				whiteSpace: 'nowrap',
				flexShrink: 0,
				fontSize: 13,
				color: 'text.secondary',
				backgroundColor: theme.custom.palette.neutralBackground.normal,
				borderRadius: '12px',
			}}
		>
			{folderCount.formatted}
		</Stack>
	)
}
