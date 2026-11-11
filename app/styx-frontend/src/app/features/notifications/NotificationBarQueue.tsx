import Alert, { AlertColor } from '@mui/material/Alert'
import { useState } from 'react'
import { v4 as getRandomId } from 'uuid'

import { useEventBusSubscribe } from '../eventBus'
import { EventParams } from '../eventBus/types'
import { StackableSnackbar } from './components/StackableSnackbar'

export function NotificationBarQueue() {
	const [notifications, setNotifications] = useState<QueuedNotification[]>([])

	const dismiss = (id: string) => {
		setNotifications((current) => current.filter((notification) => notification.id !== id))
	}

	useEventBusSubscribe['notifications/push']({
		callback: (params) => {
			const id = getRandomId()
			const severity = params.severity ?? 'info'
			setNotifications((current) => [...current, { id, severity, message: params.message }])
			setTimeout(() => dismiss(id), dismissDelays[severity])
		},
	})

	return notifications.map((notification) => (
		<StackableSnackbar key={notification.id} open>
			<Alert severity={notification.severity} onClose={() => dismiss(notification.id)}>
				{notification.message}
			</Alert>
		</StackableSnackbar>
	))
}

type QueuedNotification = Required<EventParams['notifications/push']> & {
	id: string
}

const dismissDelays: Record<AlertColor, number> = {
	success: 3000,
	info: 3000,
	warning: 5000,
	error: 15000,
}
