import { createContext, Dispatch, ReactNode, SetStateAction } from 'react'

export const NotificationBarContext = createContext<Dispatch<SetStateAction<StackedSnackbar[]>>>(() => {
	throw new Error('StackableSnackbar must be rendered inside NotificationBar')
})

export type StackedSnackbar = {
	id: string
	content: ReactNode
}
