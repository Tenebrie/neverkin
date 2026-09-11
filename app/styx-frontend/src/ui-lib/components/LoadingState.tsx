import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'

export function LoadingState() {
	return (
		<Stack width="100%" height="100%" alignItems="center" justifyContent="center">
			<CircularProgress />
		</Stack>
	)
}
