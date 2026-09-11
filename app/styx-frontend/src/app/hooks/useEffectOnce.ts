import { useEffect } from 'react'

export const useEffectOnce = (callback: () => void | (() => void)) => {
	// eslint-disable-next-line @eslint-react/exhaustive-deps
	useEffect(callback, [])
}
