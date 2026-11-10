import Box from '@mui/material/Box'
import { alpha } from '@mui/material/styles'

type Props = {
	text: string
	query: string
}

export function HighlightedText({ text, query }: Props) {
	if (!query) {
		return <>{text}</>
	}

	const idx = text.toLowerCase().indexOf(query.toLowerCase())
	if (idx === -1) {
		return <>{text}</>
	}
	return (
		<>
			{text.slice(0, idx)}
			<Box
				component="span"
				sx={{
					backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.3),
					borderRadius: 0.5,
					boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.secondary.main, 0.3)}`,
				}}
			>
				{text.slice(idx, idx + query.length)}
			</Box>
			{text.slice(idx + query.length)}
		</>
	)
}
