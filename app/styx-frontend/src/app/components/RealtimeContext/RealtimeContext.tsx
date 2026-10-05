import { createContext, ReactNode, useInsertionEffect, useRef, useState } from 'react'

export function createRealtimeContext<T extends object>(useValue: () => T) {
	const LiveContext = createContext<T | null>(null)

	function Provider({ children }: { children: ReactNode }) {
		const value = useValue()
		const latest = useRef(value)
		useInsertionEffect(() => {
			latest.current = value
		})
		const [live] = useState(() => new Proxy(value, { get: (_, key) => Reflect.get(latest.current, key) }))
		return <LiveContext value={live}>{children}</LiveContext>
	}
	Provider.context = LiveContext

	return Provider
}
