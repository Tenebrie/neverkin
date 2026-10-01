import { createContext, ReactNode, use } from 'react'

interface ResizeableDrawerContextProps {
	height: number
	minHeight: number
	maxHeight: number
	drawerVisible: boolean
	preferredOpen: boolean
	setDrawerHeight: (value: number) => void
	setDrawerVisible: (value: boolean) => void
}

const ResizeableDrawerContext = createContext<ResizeableDrawerContextProps | undefined>(undefined)

type ProviderProps = {
	children: ReactNode
	height: number
	minHeight: number
	maxHeight: number
	drawerVisible: boolean
	preferredOpen: boolean
	setDrawerHeight: (value: number) => void
	setDrawerVisible: (value: boolean) => void
}

export function ResizeableDrawerProvider({
	children,
	height,
	minHeight,
	maxHeight,
	drawerVisible,
	preferredOpen,
	setDrawerHeight,
	setDrawerVisible,
}: ProviderProps) {
	return (
		<ResizeableDrawerContext
			value={{
				height,
				minHeight,
				maxHeight,
				drawerVisible,
				preferredOpen,
				setDrawerHeight,
				setDrawerVisible,
			}}
		>
			{children}
		</ResizeableDrawerContext>
	)
}

export const useResizeableDrawer = () => {
	const context = use(ResizeableDrawerContext)
	if (context === undefined) {
		throw new Error('useResizeableDrawer must be used within a ResizeableDrawerProvider')
	}
	return context
}
