import { SxProps } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

import { useCustomTheme } from '@/app/features/theming/hooks/useCustomTheme'

import { BoxedWikiEntity } from '../hooks/useBoxedWikiContent'
import { ArticleListItemSecondaryEvent } from './ArticleListItemSecondaryEvent'

type Props = {
	entity: BoxedWikiEntity
	highlighted: boolean
}

export function ArticleListItemSecondary({ entity, highlighted }: Props) {
	const theme = useCustomTheme()
	const color = (() => {
		if (highlighted && theme.mode === 'light') {
			return 'primary.contrastText'
		}
		return 'text.secondary'
	})()

	const styles: SxProps = {
		color,
		display: 'block',
		maxWidth: '100%',
		fontWeight: 400,
		lineHeight: '1.1rem',
		transition: 'color 0.1s ease-out',
		textOverflow: 'ellipsis',
		overflow: 'hidden',
		whiteSpace: 'nowrap',
		flexGrow: 0,
	}

	if (entity.type === 'actor' && entity.entity.title) {
		return (
			<Typography variant="caption" sx={styles}>
				{entity.entity.title}
			</Typography>
		)
	}

	if (entity.type === 'tag') {
		const mentionCount = entity.entity.mentionedIn.length
		return (
			<Typography variant="caption" sx={styles}>
				{mentionCount} mention{mentionCount !== 1 ? 's' : ''}
			</Typography>
		)
	}

	if (entity.type === 'event') {
		return <ArticleListItemSecondaryEvent event={entity.entity} sx={styles} />
	}

	return null
}
