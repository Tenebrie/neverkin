import { Context, createContext, ReactNode, use, useInsertionEffect, useRef, useState } from 'react'

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

export function useRealtimeContext<T extends object>(realtimeContext: { context: Context<T | null> }): T {
	const value = use(realtimeContext.context)
	if (!value) {
		throw new Error('useRealtimeContext called outside its provider')
	}
	return value
}
