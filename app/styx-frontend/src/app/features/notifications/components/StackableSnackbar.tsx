import { ReactNode, use, useEffect, useId } from 'react'

import { NotificationBarContext } from '../NotificationBarContext'

type Props = {
	open: boolean
	children: ReactNode
}

export function StackableSnackbar({ open, children }: Props) {
	const id = useId()
	const setSnackbars = use(NotificationBarContext)

	useEffect(() => {
		if (!open) {
			return
		}
		setSnackbars((snackbars) => {
			if (snackbars.some((snackbar) => snackbar.id === id)) {
				return snackbars.map((snackbar) => (snackbar.id === id ? { id, content: children } : snackbar))
			}
			return [...snackbars, { id, content: children }]
		})
	}, [id, open, children, setSnackbars])

	useEffect(() => {
		if (!open) {
			return
		}
		return () => setSnackbars((snackbars) => snackbars.filter((snackbar) => snackbar.id !== id))
	}, [id, open, setSnackbars])

	return null
}
