import Alert from '@mui/material/Alert'
import { useSelector } from 'react-redux'

import { getAuthState } from '../../auth/AuthSliceSelectors'
import { StackableSnackbar } from '../../notifications/components/StackableSnackbar'

type Props = {
	server: 'rhea' | 'calliope'
}

export function LostConnectionAlert({ server }: Props) {
	const { showRheaConnectionAlert } = useSelector(getAuthState)
	const { showCalliopeConnectionAlert } = useSelector(getAuthState)

	const open =
		(server === 'rhea' && showRheaConnectionAlert) || (server === 'calliope' && showCalliopeConnectionAlert)

	return (
		<StackableSnackbar open={open}>
			<Alert severity="warning">Lost connection to the server</Alert>
		</StackableSnackbar>
	)
}
