import Box from '@mui/material/Box'
import { alpha } from '@mui/material/styles'

import { GlobalSearchApiArg } from '@/api/worldSearchApi'

type Props = {
	text: string
	query: string
	mode: GlobalSearchApiArg['mode']
}

export function HighlightedText({ text, query, mode }: Props) {
	mode = mode ?? 'string_match'
	const terms = (mode === 'string_match' ? [query] : query.split(/\s+/)).filter((term) => term.length > 0)
	if (terms.length === 0) {
		return <>{text}</>
	}

	const anyTermMatchPattern = terms
		.toSorted((a, b) => b.length - a.length)
		.map((term) => RegExp.escape(term))
		.join('|')
	const textSegments = text.split(new RegExp(`(${anyTermMatchPattern})`, 'i'))

	return (
		<>
			{textSegments.map((part, index) => {
				const isMatch = index % 2 === 1
				if (!isMatch) {
					return part
				}
				return (
					<Box
						key={index}
						component="span"
						sx={{
							backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.3),
							borderRadius: 0.5,
							boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.secondary.main, 0.3)}`,
						}}
					>
						{part}
					</Box>
				)
			})}
		</>
	)
}
