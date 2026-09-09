import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'

export function GlobalSearch() {
	// Input should fit the container and leave a bit of padding above and below

	return (
		<TextField
			size="small"
			variant="outlined"
			placeholder="Search..."
			sx={{ padding: '4px 0', maxWidth: 192 }}
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
