import { ReactNode } from 'react'

import { NotificationBarProvider } from './NotificationBarProvider'
import { NotificationBarQueue } from './NotificationBarQueue'

type Props = {
	children: ReactNode
}

export function NotificationBar({ children }: Props) {
	return (
		<NotificationBarProvider>
			{children}
			<NotificationBarQueue />
		</NotificationBarProvider>
	)
}
