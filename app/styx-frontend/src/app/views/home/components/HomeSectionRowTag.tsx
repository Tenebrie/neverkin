import Chip from '@mui/material/Chip'

type Props = {
	label: string
	accent?: boolean
}

export function HomeSectionRowTag({ label, accent }: Props) {
	return (
		<Chip
			label={label}
			size="small"
			variant="outlined"
			color={accent ? 'primary' : 'default'}
			sx={{
				flex: '0 0 auto',
				height: 20,
				'& .MuiChip-label': { px: 0.75, typography: 'caption' },
			}}
		/>
	)
}
