import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'

export function GlobalSearch() {
	return (
		<TextField
			size="small"
			variant="outlined"
			placeholder="Search..."
			sx={{
				padding: '2px 0',
				maxWidth: 192,
				'& .MuiOutlinedInput-input': { padding: '6px 6px 6px 0px' },
			}}
			slotProps={{
				input: {
					startAdornment: (
						<InputAdornment position="start">
							<SearchIcon
								sx={{
									color: (theme) => theme.palette.text.secondary,
								}}
							/>
						</InputAdornment>
					),
				},
			}}
		/>
	)
}
