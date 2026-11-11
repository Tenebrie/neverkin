import { alertClasses } from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import { ReactNode, useState } from 'react'
import { TransitionGroup } from 'react-transition-group'

import { NotificationBarContext, StackedSnackbar } from './NotificationBarContext'

type Props = {
	children: ReactNode
}

export function NotificationBarProvider({ children }: Props) {
	const [snackbars, setSnackbars] = useState<StackedSnackbar[]>([])

	return (
		<NotificationBarContext value={setSnackbars}>
			{children}
			<Box
				sx={{
					position: 'fixed',
					left: 24,
					bottom: 24,
					zIndex: 'snackbar',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'flex-start',
				}}
			>
				<TransitionGroup component={null}>
					{snackbars.slice(-5).map((snackbar) => (
						<Collapse key={snackbar.id}>
							<Box
								sx={{
									paddingTop: 1,
									[`& .${alertClasses.action}`]: { paddingTop: 0 },
								}}
							>
								{snackbar.content}
							</Box>
						</Collapse>
					))}
				</TransitionGroup>
			</Box>
		</NotificationBarContext>
	)
}
